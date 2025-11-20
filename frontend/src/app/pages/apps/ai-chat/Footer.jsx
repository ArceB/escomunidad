import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { object, string } from "yup";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";

import { Button, Input } from "components/ui";
import { useChatContext } from "./Chat.context";

const schema = object().shape({
  content: string().required("Por favor, escribe un mensaje"),
});

export function Footer() {
  const { newMessage, currentChat, isLoading, setIsLoading } = useChatContext();

  const recaptchaRef = useRef();
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaValid, setCaptchaValid] = useState(false);

  const {
    register,
    handleSubmit,
    setFocus,
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { content: "" },
  });

  const watchInput = watch("content");

  useEffect(() => {
    reset();
    if (currentChat?.id) {
      setTimeout(() => setFocus("content"));
    }
  }, [currentChat?.id, reset, setFocus]);

  // 🔹 Mostrar captcha cuando el usuario toca el input
  const handleInputClick = () => {
    if (!captchaValid) setShowCaptcha(true);
  };

  // 🔹 Cuando marca "No soy un robot"
  const handleCaptcha = (token) => {
    if (token) {
      setCaptchaValid(true);
      setShowCaptcha(false);
      console.log("✔ CAPTCHA validado");
    }
  };

  const onSubmit = async (formData) => {
    if (!captchaValid) {
      alert("Por favor confirma que no eres un robot.");
      return;
    }

    const chatId = newMessage(currentChat?.id, {
      role: "user",
      content: formData.content,
    });

    setIsLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/chatbot/ask/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: formData.content }),
      });

      if (!response.ok) throw new Error(`Error: ${response.status}`);

      const data = await response.json();

      newMessage(chatId, {
        role: "assistant",
        content: data.reply ?? "⚠ El servidor no devolvió respuesta",
      });
    } catch (error) {
    console.error(" Error en el fetch:", error);
    newMessage(chatId, {
    role: "assistant",
    content: "⚠ No se pudo conectar con el servidor.",
  });
    } finally {
      reset();
      setIsLoading(false);
      setTimeout(() => setFocus("content"));
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-4">
      {/* Mostrar CAPTCHA visible solo cuando se toca el input */}
      {showCaptcha && !captchaValid && (
        <div className="mb-3 flex justify-center">
          <ReCAPTCHA
            sitekey="6LdOUREsAAAAALJ5YsWbuBKHW0-yCnw4tBxS2068"
            onChange={handleCaptcha}
            ref={recaptchaRef}
          />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
        <div className="flex h-14 items-center justify-between rounded-full bg-gray-150 px-4 dark:bg-dark-700 lg:px-6">
          <Input
            unstyled
            {...register("content")}
            disabled={isLoading}
            onClick={handleInputClick}  
            classNames={{
              root: "w-full",
              input: "placeholder:text-gray-400 dark:placeholder:text-dark-300",
            }}
            placeholder={
              isLoading ? "Esperando respuesta..." : "Escribe tu mensaje..."
            }
          />

          <Button
            variant="flat"
            type="submit"
            isIcon
            disabled={!watchInput || isLoading || !captchaValid}
            className={`size-9 rounded-full transition-colors ${
              !watchInput || isLoading || !captchaValid
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isLoading ? (
              <svg
                className="size-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                ></path>
              </svg>
            ) : (
              <PaperAirplaneIcon className="size-5 rtl:rotate-180" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
