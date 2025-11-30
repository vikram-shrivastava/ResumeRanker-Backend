import {z} from "zod";
const verifyTokenSchema=z.object({
    token:z.string().length(6,"Token must be 6 characters long")
})
export default verifyTokenSchema;