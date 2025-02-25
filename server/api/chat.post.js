export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const body = await readBody(event);

  try {
    const response = await $fetch(config.public.apiBase, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": config.apiKey,
      },
      body,
    });

    return response;
  } catch (error) {
    console.error("API Error:", error);
    throw createError({
      statusCode: error.statusCode,
      message: error.message,
    });
  }
});
