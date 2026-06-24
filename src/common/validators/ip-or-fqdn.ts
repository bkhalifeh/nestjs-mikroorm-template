import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  isFQDN,
  isIP,
  Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'ipOrFqdn', async: false })
export class IpOrFqdn implements ValidatorConstraintInterface {
  validate(value: any): Promise<boolean> | boolean {
    // require_tld:false so container/orchestrator service names (e.g. "postgres",
    // "redis") and "localhost" validate, alongside real FQDNs and IPs.
    return isFQDN(value, { require_tld: false }) || isIP(value);
  }

  defaultMessage() {
    return 'Text ($value) is not FQDN or IP!';
  }
}

export const IsIpOrFqdn = () => Validate(IpOrFqdn);
