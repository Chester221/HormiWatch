import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'isAfterDate', async: false })
export class IsAfterDateConstraint implements ValidatorConstraintInterface {
  validate(propertyValue: string, args: ValidationArguments) {
    const object = args.object as any;
    const [relatedPropertyName] = args.constraints;
    const relatedValue = object[relatedPropertyName];

    // Check if both dates are present before comparing
    if (!propertyValue || !relatedValue) {
      return true; // Use other validators to check for presence
    }

    const date = new Date(propertyValue);
    const relatedDate = new Date(relatedValue);

    return date > relatedDate; // Check if the date is after the related date
  }

  defaultMessage(args: ValidationArguments) {
    const [relatedPropertyName] = args.constraints;
    return `${args.property} must be after ${relatedPropertyName}`;
  }
}

export function IsAfterDate(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [property],
      validator: IsAfterDateConstraint,
    });
  };
}
