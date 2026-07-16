import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { registry } from "./registry";
import "./index";

export function generateOpenAPIDocument() {
    const generator = new OpenApiGeneratorV3(registry.definitions);

    return generator.generateDocument({
        openapi: "3.0.3",

        info: {
            title: "Fusion Circle API",
            version: "1.0.0",
            description: "REST API for Fusion Circle",
        },

        servers: [
            {
                url: process.env.API_URL ?? "http://localhost:5000/api/v1",
                description: process.env.NODE_ENV === "production"
                    ? "Production"
                    : "Development",
            },
        ],
    });
}