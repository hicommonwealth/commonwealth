import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

type FormProps = {
  id?: string;
  onSubmit?: (values: any) => any;
  children?: any;
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
  onSubmit,
  validationSchema,
  children,
  className,
  initialValues,
}: FormProps) => {
  const formMethods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: initialValues,
  });

  const handleFormSubmit = async (event) => {
    // This will chain our custom onSubmit along with the react-hook-form's submit chain
    await formMethods.handleSubmit(onSubmit)(event);
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
