import { zodResolver } from '@hookform/resolvers/zod';
import React, {
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
} from 'react';
import { FormProvider, UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod';

type FormProps = {
  id?: string;
  onSubmit?: (values: any) => any;
  onErrors?: (errors: any) => any;
  children?: any | ((formMethods: UseFormReturn) => ReactNode);
  className?: string;
  initialValues?: Object;
  validationSchema: z.Schema<any, any>;
  onWatch?: (values: any) => void;
};

export type CWFormRef = UseFormReturn;

/**
 * Provides a wrapper around the HTML <form/> components. This wrapper
 * adds form validation to the nested fields with a simple to use API.
 */
const CWForm = forwardRef<UseFormReturn, FormProps>(
  (
    {
      id,
      onSubmit = () => null,
      onErrors = () => null,
      validationSchema,
      children,
      className,
      initialValues,
      onWatch,
    }: FormProps,
    ref,
  ) => {
    const formMethods: UseFormReturn = useForm({
      resolver: zodResolver(validationSchema),
      defaultValues: initialValues,
      mode: 'all',
    });

    // Expose formMethods to parent components using ref
    useImperativeHandle(ref, () => formMethods);

    useEffect(() => {
      if (onWatch) {
        const subscription = formMethods.watch(onWatch);
        return () => subscription.unsubscribe();
      }
    }, [formMethods, onWatch]);

    const handleFormSubmit = async (event) => {
      // This will chain our custom onSubmit along with the react-hook-form's submit chain
      await formMethods.handleSubmit(onSubmit)(event);

      // trigger error callback if there are any errors
      if (Object.keys(formMethods.formState.errors).length) {
        await onErrors(formMethods.formState.errors);
      }
    };

    return (
      <FormProvider {...formMethods}>
        {/* eslint-disable @typescript-eslint/no-misused-promises */}
        <form id={id} onSubmit={handleFormSubmit} className={className}>
          {typeof children === 'function' ? children(formMethods) : children}
        </form>
      </FormProvider>
    );
  },
);

CWForm.displayName = 'CWForm';

export { CWForm };
