import { BadRequestException, HttpStatus } from "@nestjs/common";
import { ValidationError } from "class-validator";

export const transformErrors = (validationErrors: ValidationError[] = []) => {
  const errors = {};
  
  validationErrors.forEach((validationError: ValidationError) => {
    errors[validationError.property] = Object.keys(validationError.constraints).length > 0
      ? validationError.constraints[
        Object.keys(validationError.constraints)[0]
      ]
      : undefined;
  });

  const error = {
    statusCode: HttpStatus.BAD_REQUEST,
    message: 'BadRequest',
    errors,
  };

  return new BadRequestException(error);
}