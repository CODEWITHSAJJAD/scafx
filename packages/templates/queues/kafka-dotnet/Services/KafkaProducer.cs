using Confluent.Kafka;

namespace {{projectName}}.Services;

public class KafkaProducer
{
    private readonly IConfiguration _config;

    public KafkaProducer(IConfiguration config)
    {
        _config = config;
    }

    public async Task ProduceAsync(string topic, string key, string value)
    {
        var config = new ProducerConfig
        {
            BootstrapServers = _config["Kafka:BootstrapServers"] ?? "localhost:9092"
        };

        using var producer = new ProducerBuilder<string, string>(config).Build();
        await producer.ProduceAsync(topic, new Message<string, string> { Key = key, Value = value });
    }
}
