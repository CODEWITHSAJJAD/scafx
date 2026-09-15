export interface ServiceMetadata {
  serviceId: string;
  name: string;
  version: string;
  uptime: number;
}

export function getServiceDescriptor(name = '{{projectName}}'): ServiceMetadata {
  return {
    serviceId: `${name}-${process.pid}`,
    name,
    version: '1.0.0',
    uptime: process.uptime(),
  };
}
