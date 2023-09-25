import { zodResolver } from '@hookform/resolvers/zod';
import React, { ReactNode } from 'react';
import { FormProvider, useForm, UseFormReturn } from 'react-hook-form';
import { z } from 'zod';

type FormProps = {
  id?: string;
  onSubmit?: (values: any) => any;
  onErrors?: (errors: any) => any;
  children?: any | ((formMethods: UseFormReturn) => ReactNode);
  className?: string;
  initialValues?: Object;
  validationSchema: z.Schema<any, any>;
};

/**
 * Provides a wrapper around the HTML <form/> components. This wrapper
 * adds form validation to the nested fields with a simple to use API.
 */
const CWForm = ({
  id,
  onSubmit = () => null,
  onErrors = () => null,
  validationSchema,
  children,
  className,
  initialValues,
}: FormProps) => {
  const formMethods: UseFormReturn = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
  });

  const handleFormSubmit = async (event) => {
    // This will chain our custom onSubmit along with the react-hook-form's submit chain
    await formMethods.handleSubmit(onSubmit)(event);

    // trigger error callback if there are any errors
    Object.keys(formMethods.formState.errors).length && await onErrors(formMethods.formState.errors)
  };

  return (
    <FormProvider {...formMethods}>
      <form id={id} onSubmit={handleFormSubmit} className={className}>
        {typeof children === 'function' ? children(formMethods) : children}
      </form>
    </FormProvider>
  );
};

export { CWForm };
