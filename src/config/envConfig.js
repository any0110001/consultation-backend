import dotenv from "dotenv";
import Joi from "joi";
import path from "path";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const envFileExtension = `.${process.env.NODE_ENV}`;
dotenv.config({ path: path.join(__dirname, `../../.env${envFileExtension}`) });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("production", "development", "test")
      .required(),
    PORT: Joi.number().default(3000),
    AZURE_SUBSCRIPTION_KEY: Joi.string(),
    AZURE_REGION: Joi.string(),
    REDIS_HOST: Joi.string(),
    REDIS_PORT: Joi.number(),
    REDIS_PASSWORD: Joi.string()
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  azure: {
    key: envVars.AZURE_SUBSCRIPTION_KEY,
    region: envVars.AZURE_REGION,
  },
  redis: {
    host: envVars.REDIS_HOST,
    port: envVars.REDIS_PORT,
    password: envVars.REDIS_PASSWORD,
  },
};
