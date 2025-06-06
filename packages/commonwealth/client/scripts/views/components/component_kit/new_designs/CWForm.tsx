import { zodResolver } from '@hookform/resolvers/zod';
import React, {
  ReactNode,
  forwardRef,
  useEffect,
  useImperativeHandle,
} from 'react';
import { FormProvider, UseFormReturn, useForm } from 'react-hook-form';
import { z } from 'zod/v4';

type FormProps = {
  id?: string;
  onSubmit?: (values: any) => any;
  onErrors?: (errors: any) => any;
  children?: any | ((formMethods: UseFormReturn) => ReactNode);
  className?: string;
  initialValues?: Object;
  validationSchema: z.ZodType;
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
    // Note: this doesn't expose watchers/subscribers, i.e ref.watch(`field_name`) would act
    // as a getter, and not a subscriber. For subscriber based functions, the callback signature
    // will work as a proper subscriber i.e ref.watch((values) => values.field_name).
    useImperativeHandle(ref, () => formMethods);

    useEffect(() => {
      if (onWatch) {
        const subscription = formMethods.watch(onWatch);
        return () => subscription.unsubscribe();
      }
    }, [formMethods, onWatch]);

    const handleFormSubmit = (event) => {
      // This will chain our custom onSubmit along with the react-hook-form's submit chain
      formMethods
        .handleSubmit(onSubmit)(event)
        .then(() => {
          // trigger error callback if there are any errors
          if (Object.keys(formMethods.formState.errors).length) {
            onErrors(formMethods.formState.errors);
          }
        })
        .catch((e) => {
          console.error(`CWForm submit error => `, e);
        });
    };

    return (
      <FormProvider {...formMethods}>
        <form id={id} onSubmit={handleFormSubmit} className={className}>
          {typeof children === 'function' ? children(formMethods) : children}
        </form>
      </FormProvider>
    );
  },
);

CWForm.displayName = 'CWForm';

export { CWForm };
