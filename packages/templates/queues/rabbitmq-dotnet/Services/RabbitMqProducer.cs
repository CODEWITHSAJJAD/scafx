using System.Text;
using RabbitMQ.Client;

namespace {{projectName}}.Services;

public class RabbitMqProducer
{
    private readonly IConfiguration _config;

    public RabbitMqProducer(IConfiguration config)
    {
        _config = config;
    }

    public async Task PublishMessageAsync(string queueName, string message)
    {
        var factory = new ConnectionFactory { HostName = _config["RabbitMQ:Host"] ?? "localhost" };
        using var connection = await factory.CreateConnectionAsync();
        using var channel = await connection.CreateChannelAsync();

        await channel.QueueDeclareAsync(queue: queueName, durable: true, exclusive: false, autoDelete: false, arguments: null);

        var body = Encoding.UTF8.GetBytes(message);
        await channel.BasicPublishAsync(exchange: string.Empty, routingKey: queueName, body: body);
    }
}
