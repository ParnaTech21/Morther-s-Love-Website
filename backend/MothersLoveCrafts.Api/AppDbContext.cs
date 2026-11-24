using Microsoft.EntityFrameworkCore;

namespace MothersLoveCrafts.Api;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<ContactMessage> Messages => Set<ContactMessage>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<Product>().Property(p => p.Price).HasPrecision(12, 2);
        b.Entity<Order>().Property(o => o.Total).HasPrecision(12, 2);
        b.Entity<OrderItem>().Property(i => i.UnitPrice).HasPrecision(12, 2);
    }
}

public static class Seed
{
    public static void Run(AppDbContext db)
    {
        if (db.Products.Any()) return;
        var a = new Product { Name = "Sample product one", Category = "Gifts", Price = 15, Description = "Replace this with a real product from the admin dashboard." };
        var b = new Product { Name = "Sample product two", Category = "Home", Price = 24, Description = "Replace this with a real product from the admin dashboard." };
        var c = new Product { Name = "Sample product three", Category = "Gifts", Price = 9.5m, Description = "Replace this with a real product from the admin dashboard." };
        db.Products.AddRange(a, b, c);
        db.Reviews.AddRange(
            new Review { Product = a, Author = "Sample customer", Rating = 5, Comment = "Beautifully made.", Approved = true },
            new Review { Product = b, Author = "Another customer", Rating = 4, Comment = "Lovely gift, arrived well wrapped.", Approved = true });
        db.SaveChanges();
    }
}
