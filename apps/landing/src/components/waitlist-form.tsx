import { z } from "zod";
import { Button } from "@note/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@note/ui/components/form";
import { Input } from "@note/ui/components/input";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@note/ui/lib/utils";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@note/sdk";
import { toast } from "sonner";

const formSchema = z.object({
  email: z.string().email(),
});

const addWaitlistEmailFunction = createServerFn({
  method: "POST",
})
  .validator((req: unknown) => {
    return formSchema.parse(req);
  })
  .handler(async (ctx) => {
    const api = createClient(import.meta.env.VITE_API_URL);
    const resp = await api.waitlist.$post({ json: { email: ctx.data.email } });
    return await resp.json();
  });

interface WaitlistFormProps extends ComponentPropsWithoutRef<"form"> {
  onSuccess?: () => void;
}

export function WaitlistForm({
  className,
  onSuccess,
  ...props
}: WaitlistFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const resp = await addWaitlistEmailFunction({
        data: { email: values.email },
      });
      if (resp.success) {
        onSuccess?.();
        toast.success("Email added to waitlist");
      } else {
        toast.error("Failed to add email to waitlist");
      }
    } catch (error) {
      toast.error("Failed to add email to waitlist");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn("flex gap-2", className)}
        {...props}
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="w-full">
              <FormControl>
                <Input placeholder="noname@text.co" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}
