"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

const formSchema = z.object({
  email: z.string().email({ message: "Ingresa un correo válido" }),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(20, "La contraseña debe tener menos de 20 caracteres"),
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const defaultValues = {
    email: "",
    password: "",
  };

  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const onSubmit = useCallback(
    async (data: UserFormValue) => {
      if (loading || !isHydrated) return;
      setLoading(true);
      setError("");
      try {
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });
        if (result?.error) {
          setError(result.error);
          toast.error("Error al iniciar sesión: " + result.error);
        } else {
          toast.success("Sesión Iniciada correctamente. ¡Bienvenido!");
          const permissionsRes = await fetch("/api/user/menu-permissions");
          if (permissionsRes.ok) {
            const payload = (await permissionsRes.json()) as {
              menuPermissions?: string[];
            };
            const { resolveDefaultDashboardPath } = await import(
              "@/types/menu-permissions"
            );
            router.replace(
              resolveDefaultDashboardPath(payload.menuPermissions),
            );
          } else {
            router.replace("/dashboard");
          }
          router.refresh();
        }
      } catch (error) {
        setError("Ocurrió un error al iniciar sesion");
        toast.error("Error inesperado al iniciar sesión");
      } finally {
        setLoading(false);
      }
    },
    [isHydrated, loading, router],
  );

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          method="post"
          noValidate
          className="space-y-2 w-full"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Correo Electrónico</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Ingresa tu correo..."
                    disabled={loading || !isHydrated}
                    {...field}
                  />
                </FormControl>
                {form.formState.errors.email && (
                  <FormMessage>
                    {form.formState.errors.email.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Ingresa tu contraseña..."
                    disabled={loading || !isHydrated}
                    {...field}
                  />
                </FormControl>
                {form.formState.errors.password && (
                  <FormMessage>
                    {form.formState.errors.password.message}
                  </FormMessage>
                )}
              </FormItem>
            )}
          />

          {error && <p className="text-red-500">{error}</p>}

          <Button
            disabled={loading || !isHydrated}
            className="ml-auto w-full"
            type="submit"
          >
            {!isHydrated
              ? "Cargando..."
              : loading
              ? "Ingresando..."
              : "Ingresar"}
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
      </div>
    </>
  );
}
