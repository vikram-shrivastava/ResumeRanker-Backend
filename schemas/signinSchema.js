import { z } from "zod";
export const signInSchema=z.object({
    identifier:z.string(), //means username or email
    password:z.string()
})