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
    var response = await client.Indices.CreateAsync("products");
    return response.IsValidResponse ? Results.Ok("Index created") : Results.BadRequest(response.DebugInformation);
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
        .Highlight(h => h
            .Fields(f => f
                .Add("name", new Elastic.Clients.Elasticsearch.HighlightField())
                .Add("description", new Elastic.Clients.Elasticsearch.HighlightField())
            )
        )
    );

    return response.IsValidResponse ? Results.Ok(response.Hits) : Results.BadRequest(response.DebugInformation);
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
