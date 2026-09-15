using MassTransit;
using Microsoft.Extensions.DependencyInjection;

namespace {{projectName}}.Queue;

public static class MassTransitExtensions
{
    public static IServiceCollection AddMessageBus(this IServiceCollection services)
    {
        services.AddMassTransit(x =>
        {
            x.UsingInMemory((context, cfg) =>
            {
                cfg.ConfigureEndpoints(context);
            });
        });

        return services;
    }
}
