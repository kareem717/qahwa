
import { z } from "zod"
import { Button } from "@note/ui/components/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@note/ui/components/form"
import { Input } from "@note/ui/components/input"
import { addWaitlistEmail } from "@note/landing/functions/waitlist"
import { ComponentPropsWithoutRef } from "react"
import { cn } from "@note/ui/lib/utils"
import { InsertWaitlistEmailSchema } from "@note/db/validation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

export function WaitlistForm({ className, ...props }: ComponentPropsWithoutRef<"form">) {
  const form = useForm<z.infer<typeof InsertWaitlistEmailSchema>>({
    resolver: zodResolver(InsertWaitlistEmailSchema),
    defaultValues: {
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof InsertWaitlistEmailSchema>) {
    await addWaitlistEmail({ data: { email: values.email } })
    console.log(values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn("flex gap-2", className)} {...props}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="noname@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  )
}