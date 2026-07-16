import {
    OpenAPIRegistry,
    extendZodWithOpenApi,
} from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

registry.registerComponent(
    "securitySchemes",
    "sessionAuth",
    {
        type: "apiKey",
        in: "cookie",
        name: "connect.sid",
    }
);