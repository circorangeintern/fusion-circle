import swaggerUi from "swagger-ui-express";
import { Express } from "express";
import { generateOpenAPIDocument } from "./generator";

export function setupSwagger(app: Express) {
    const document = generateOpenAPIDocument();

    app.use(
        "/docs",
        swaggerUi.serve,
        swaggerUi.setup(document)
    );

    app.get("/openapi.json", (_, res) => {
        res.json(document);
    });
}