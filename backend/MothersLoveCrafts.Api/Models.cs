namespace MothersLoveCrafts.Api;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Description { get; set; } = "";
    public decimal Price { get; set; }
    public string Category { get; set; } = "";
    public string ImageUrl { get; set; } = "";
    public bool IsAvailable { get; set; } = true;
    public List<Review> Reviews { get; set; } = new();
}

public class Review
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Author { get; set; } = "";
    public int Rating { get; set; }
    public string Comment { get; set; } = "";
    public bool Approved { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ContactMessage
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string Message { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public record ProductDto(int Id, string Name, string Description, decimal Price, string Category,
    string ImageUrl, bool IsAvailable, double AverageRating, int ReviewCount);
public record ReviewDto(int Id, string Author, int Rating, string Comment, DateTime CreatedAt);
public record ProductInput(string? Name, string? Description, decimal Price, string? Category, string? ImageUrl, bool IsAvailable);
public record ReviewInput(string? Author, int Rating, string? Comment);
public record ContactInput(string? Name, string? Email, string? Message);
public record LoginInput(string? Username, string? Password);

public class Order
{
    public int Id { get; set; }
    public string Reference { get; set; } = "";
    public string CustomerName { get; set; } = "";
    public string Phone { get; set; } = "";
    public string Address { get; set; } = "";
    public string Notes { get; set; } = "";
    public string PaymentMethod { get; set; } = "Cash";   // Cash | MTN | Airtel
    public string PaymentReference { get; set; } = "";    // mobile money transaction ID
    public decimal Total { get; set; }
    public string Status { get; set; } = "New";           // New | Paid | Completed | Cancelled
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<OrderItem> Items { get; set; } = new();
}

public class OrderItem
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public int ProductId { get; set; }
    public string ProductName { get; set; } = "";
    public decimal UnitPrice { get; set; }
    public int Quantity { get; set; }
}

public record OrderLineInput(int ProductId, int Quantity);
public record OrderInput(string? Name, string? Phone, string? Address, string? Notes, string? PaymentMethod,
    string? PaymentReference, List<OrderLineInput>? Items);
public record StatusInput(string? Status);
