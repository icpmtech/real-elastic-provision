using Elastic.Clients.Elasticsearch;
using Elastic.Transport;
using ElasticApp;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddOpenApi();
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Configure Elasticsearch
var settings = new ElasticsearchClientSettings(new Uri(builder.Configuration["Elasticsearch:Uri"] ?? "http://elasticsearch:9200"))
    .DefaultIndex("products");

var client = new ElasticsearchClient(settings);
builder.Services.AddSingleton(client);
var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors();
app.UseHttpsRedirection();

app.MapPost("/create-index", async (ElasticsearchClient client) =>
{
    var response = await client.Indices.CreateAsync("products", c => c
        .Mappings(m => m
            .Properties<Product>(p => p
                .Keyword(k => k.Category)
                .Text(t => t.Name)
                .Text(t => t.Description)
                .DoubleNumber(d => d.Price)
            )
        )
    );
    return response.IsValidResponse ? Results.Ok("Index created") : Results.BadRequest(response.DebugInformation);
});

app.MapPost("/seed", async (ElasticsearchClient client) =>
{
    var categories = new[] { "Electronics", "Clothing", "Home", "Books", "Sports" };
    var adjectives = new[] { "Premium", "Budget", "Luxury", "Essential", "Pro", "Smart" };
    var nouns = new[] { "Widget", "Gadget", "Device", "Tool", "Accessory", "System" };

    var products = Enumerable.Range(1, 100).Select(i => new Product
    {
        Id = Guid.NewGuid().ToString(),
        Name = $"{adjectives[Random.Shared.Next(adjectives.Length)]} {nouns[Random.Shared.Next(nouns.Length)]} {i}",
        Description = $"A very useful item for your {categories[Random.Shared.Next(categories.Length)]} needs. Features high quality materials.",
        Category = categories[Random.Shared.Next(categories.Length)],
        Price = Math.Round((decimal)(Random.Shared.NextDouble() * 1000), 2)
    });

    var response = await client.BulkAsync(b => b
        .Index("products")
        .IndexMany(products)
    );

    return response.IsValidResponse ? Results.Ok($"Seeded {products.Count()} products") : Results.BadRequest(response.DebugInformation);
});

app.MapPost("/ingest", async (ElasticsearchClient client, Product product) =>
{
    var response = await client.IndexAsync(product);
    return response.IsValidResponse ? Results.Ok("Product indexed") : Results.BadRequest(response.DebugInformation);
});

app.MapGet("/search", async (ElasticsearchClient client, string query) =>
{
    var response = await client.SearchAsync<Product>(s => s
        .Query(q => q
            .MultiMatch(m => m
                .Fields(new [] { "name", "description" })
                .Query(query)
                .Fuzziness(new Fuzziness("AUTO"))
            )
        )
        .Aggregations(a => a
            .Terms("categories", t => t.Field(f => f.Category))
            .Stats("price_stats", st => st.Field(f => f.Price))
        )
    );

    if (!response.IsValidResponse) return Results.BadRequest(response.DebugInformation);

    return Results.Ok(new {
        Hits = response.Hits,
        Aggregations = new {
            Categories = response.Aggregations.GetStringTerms("categories").Buckets.Select(b => new { b.Key, b.DocCount }),
            PriceStats = response.Aggregations.GetStats("price_stats")
        }
    });
});

app.MapGet("/suggest", async (ElasticsearchClient client, string query) =>
{
    var response = await client.SearchAsync<Product>(s => s
        .Query(q => q
            .MatchBoolPrefix(p => p
                .Field(f => f.Name)
                .Query(query)
            )
        )
        .Size(5)
    );
    return response.IsValidResponse ? Results.Ok(response.Documents.Select(d => d.Name)) : Results.BadRequest(response.DebugInformation);
});

app.Run();
