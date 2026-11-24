using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MothersLoveCrafts.Api;

var builder = WebApplication.CreateBuilder(args);
var cfg = builder.Configuration;
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(cfg["Jwt:Key"]!));

builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlServer(cfg.GetConnectionString("Default")));
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => o.TokenValidationParameters = new TokenValidationParameters
    { IssuerSigningKey = key, ValidateIssuer = false, ValidateAudience = false, ValidateLifetime = true });
builder.Services.AddAuthorization();
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins(cfg.GetSection("Cors:Origins").Get<string[]>() ?? []).AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = 429;
    o.AddPolicy("public-post", http => RateLimitPartition.GetFixedWindowLimiter(
        http.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = 5, Window = TimeSpan.FromMinutes(1) }));
});

var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated(); // swap for EF migrations before going live
    Seed.Run(db);
}
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// ---------- Public ----------
app.MapGet("/api/products", async (AppDbContext db, string? category) =>
{
    var q = db.Products.AsNoTracking().Where(p => p.IsAvailable);
    if (!string.IsNullOrWhiteSpace(category)) q = q.Where(p => p.Category == category);
    return await Dto(q.OrderBy(p => p.Name)).ToListAsync();
});

app.MapGet("/api/products/{id:int}", async (int id, AppDbContext db) =>
{
    var product = await Dto(db.Products.AsNoTracking().Where(p => p.Id == id && p.IsAvailable)).FirstOrDefaultAsync();
    if (product is null) return Results.NotFound();
    var reviews = await db.Reviews.AsNoTracking().Where(r => r.ProductId == id && r.Approved)
        .OrderByDescending(r => r.CreatedAt)
        .Select(r => new ReviewDto(r.Id, r.Author, r.Rating, r.Comment, r.CreatedAt)).ToListAsync();
    return Results.Ok(new { product, reviews });
});

app.MapPost("/api/products/{id:int}/reviews", async (int id, ReviewInput i, AppDbContext db) =>
{
    if (i.Rating is < 1 or > 5) return Results.BadRequest(new { error = "Rating must be between 1 and 5." });
    if (Check((i.Author, "Name", 80), (i.Comment, "Comment", 1000)) is { } err) return Results.BadRequest(new { error = err });
    if (!await db.Products.AnyAsync(p => p.Id == id)) return Results.NotFound();
    db.Reviews.Add(new Review { ProductId = id, Author = i.Author!.Trim(), Rating = i.Rating, Comment = i.Comment!.Trim() });
    await db.SaveChangesAsync();
    return Results.Accepted(); // hidden until approved in the admin dashboard
}).RequireRateLimiting("public-post");

app.MapPost("/api/contact", async (ContactInput i, AppDbContext db) =>
{
    if (Check((i.Name, "Name", 80), (i.Email, "Email", 160), (i.Message, "Message", 2000)) is { } err)
        return Results.BadRequest(new { error = err });
    if (!i.Email!.Contains('@')) return Results.BadRequest(new { error = "Enter a valid email address." });
    db.Messages.Add(new ContactMessage { Name = i.Name!.Trim(), Email = i.Email.Trim(), Message = i.Message!.Trim() });
    await db.SaveChangesAsync();
    return Results.Accepted();
}).RequireRateLimiting("public-post");

app.MapPost("/api/auth/login", (LoginInput i) =>
{
    if (!(Same(i.Username, cfg["Admin:Username"]) & Same(i.Password, cfg["Admin:Password"]))) return Results.Unauthorized();
    var jwt = new JwtSecurityToken(claims: [new Claim(ClaimTypes.Name, i.Username!)],
        expires: DateTime.UtcNow.AddHours(8), signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));
    return Results.Ok(new { token = new JwtSecurityTokenHandler().WriteToken(jwt) });
}).RequireRateLimiting("public-post");

app.MapPost("/api/orders", async (OrderInput i, AppDbContext db) =>
{
    string[] methods = ["Cash", "MTN", "Airtel"];
    if (Check((i.Name, "Name", 80), (i.Phone, "Phone", 20), (i.Address, "Delivery address or pickup note", 300)) is { } err)
        return Results.BadRequest(new { error = err });
    if (!System.Text.RegularExpressions.Regex.IsMatch(i.Phone!, @"^[+0-9 ()-]{9,20}$"))
        return Results.BadRequest(new { error = "Enter a valid phone number." });
    if (i.PaymentMethod is null || !methods.Contains(i.PaymentMethod))
        return Results.BadRequest(new { error = "Choose a payment method." });
    if (i.PaymentMethod != "Cash" && string.IsNullOrWhiteSpace(i.PaymentReference))
        return Results.BadRequest(new { error = "Enter the mobile money transaction ID." });
    if (i.Items is not { Count: > 0 and <= 50 } || i.Items.Any(x => x.Quantity is < 1 or > 99))
        return Results.BadRequest(new { error = "Your cart is empty or has an invalid quantity." });

    var ids = i.Items.Select(x => x.ProductId).Distinct().ToList();
    var products = await db.Products.Where(p => ids.Contains(p.Id) && p.IsAvailable).ToDictionaryAsync(p => p.Id);
    if (ids.Any(id => !products.ContainsKey(id)))
        return Results.BadRequest(new { error = "Some items are no longer available. Please review your cart." });

    var order = new Order
    {
        Reference = "MLC-" + RandomNumberGenerator.GetString("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 6),
        CustomerName = i.Name!.Trim(), Phone = i.Phone!.Trim(), Address = i.Address!.Trim(),
        Notes = i.Notes?.Trim() ?? "", PaymentMethod = i.PaymentMethod,
        PaymentReference = i.PaymentMethod == "Cash" ? "" : i.PaymentReference!.Trim(),
    };
    foreach (var g in i.Items.GroupBy(x => x.ProductId))
    {
        var p = products[g.Key]; // price always comes from the database, never from the browser
        order.Items.Add(new OrderItem { ProductId = p.Id, ProductName = p.Name, UnitPrice = p.Price, Quantity = Math.Min(99, g.Sum(x => x.Quantity)) });
    }
    order.Total = order.Items.Sum(x => x.UnitPrice * x.Quantity);
    db.Orders.Add(order);
    await db.SaveChangesAsync();
    return Results.Ok(new { reference = order.Reference, total = order.Total });
}).RequireRateLimiting("public-post");

// ---------- Admin (JWT required) ----------
var admin = app.MapGroup("/api/admin").RequireAuthorization();

admin.MapGet("/products", async (AppDbContext db) => await Dto(db.Products.AsNoTracking().OrderBy(p => p.Name)).ToListAsync());

admin.MapPost("/products", async (ProductInput i, AppDbContext db) =>
{
    if (Validate(i) is { } err) return Results.BadRequest(new { error = err });
    var p = new Product(); Apply(p, i);
    db.Products.Add(p); await db.SaveChangesAsync();
    return Results.Created($"/api/products/{p.Id}", new { p.Id });
});

admin.MapPut("/products/{id:int}", async (int id, ProductInput i, AppDbContext db) =>
{
    if (Validate(i) is { } err) return Results.BadRequest(new { error = err });
    var p = await db.Products.FindAsync(id);
    if (p is null) return Results.NotFound();
    Apply(p, i); await db.SaveChangesAsync();
    return Results.NoContent();
});

admin.MapDelete("/products/{id:int}", async (int id, AppDbContext db) =>
{
    var p = await db.Products.FindAsync(id);
    if (p is null) return Results.NotFound();
    db.Products.Remove(p); await db.SaveChangesAsync();
    return Results.NoContent();
});

admin.MapGet("/reviews", async (AppDbContext db) => await db.Reviews.AsNoTracking()
    .OrderBy(r => r.Approved).ThenByDescending(r => r.CreatedAt)
    .Select(r => new { r.Id, r.Author, r.Rating, r.Comment, r.CreatedAt, r.Approved, productName = r.Product.Name }).ToListAsync());

admin.MapPut("/reviews/{id:int}/approve", async (int id, AppDbContext db) =>
{
    var r = await db.Reviews.FindAsync(id);
    if (r is null) return Results.NotFound();
    r.Approved = true; await db.SaveChangesAsync();
    return Results.NoContent();
});

admin.MapDelete("/reviews/{id:int}", async (int id, AppDbContext db) =>
{
    var r = await db.Reviews.FindAsync(id);
    if (r is null) return Results.NotFound();
    db.Reviews.Remove(r); await db.SaveChangesAsync();
    return Results.NoContent();
});

admin.MapGet("/messages", async (AppDbContext db) => await db.Messages.AsNoTracking().OrderByDescending(m => m.CreatedAt).ToListAsync());

admin.MapGet("/orders", async (AppDbContext db) => await db.Orders.AsNoTracking().OrderByDescending(o => o.CreatedAt)
    .Select(o => new
    {
        o.Id, o.Reference, o.CustomerName, o.Phone, o.Address, o.Notes, o.PaymentMethod, o.PaymentReference,
        o.Total, o.Status, o.CreatedAt,
        items = o.Items.Select(x => new { x.ProductName, x.UnitPrice, x.Quantity }),
    }).ToListAsync());

admin.MapPut("/orders/{id:int}/status", async (int id, StatusInput i, AppDbContext db) =>
{
    string[] statuses = ["New", "Paid", "Completed", "Cancelled"];
    if (i.Status is null || !statuses.Contains(i.Status)) return Results.BadRequest(new { error = "Unknown status." });
    var o = await db.Orders.FindAsync(id);
    if (o is null) return Results.NotFound();
    o.Status = i.Status; await db.SaveChangesAsync();
    return Results.NoContent();
});

app.Run();

// ---------- Helpers ----------
static IQueryable<ProductDto> Dto(IQueryable<Product> q) => q.Select(p => new ProductDto(
    p.Id, p.Name, p.Description, p.Price, p.Category, p.ImageUrl, p.IsAvailable,
    p.Reviews.Where(r => r.Approved).Average(r => (double?)r.Rating) ?? 0,
    p.Reviews.Count(r => r.Approved)));

static string? Check(params (string? v, string name, int max)[] fields) => fields
    .Where(f => string.IsNullOrWhiteSpace(f.v) || f.v.Length > f.max)
    .Select(f => $"{f.name} is required (max {f.max} characters).").FirstOrDefault();

static string? Validate(ProductInput i) =>
    Check((i.Name, "Name", 120), (i.Category, "Category", 60)) ?? (i.Price < 0 ? "Price can’t be negative." : null);

static void Apply(Product p, ProductInput i)
{
    p.Name = i.Name!.Trim(); p.Category = i.Category!.Trim();
    p.Description = i.Description?.Trim() ?? ""; p.ImageUrl = i.ImageUrl?.Trim() ?? "";
    p.Price = i.Price; p.IsAvailable = i.IsAvailable;
}

static bool Same(string? a, string? b) =>
    CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(a ?? ""), Encoding.UTF8.GetBytes(b ?? ""));
