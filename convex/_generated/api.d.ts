/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as crm_accounts from "../crm/accounts.js";
import type * as crm_campaigns from "../crm/campaigns.js";
import type * as crm_contacts from "../crm/contacts.js";
import type * as crm_opportunities from "../crm/opportunities.js";
import type * as crm_pipelineTemplates from "../crm/pipelineTemplates.js";
import type * as helpers_authedFunctions from "../helpers/authedFunctions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "crm/accounts": typeof crm_accounts;
  "crm/campaigns": typeof crm_campaigns;
  "crm/contacts": typeof crm_contacts;
  "crm/opportunities": typeof crm_opportunities;
  "crm/pipelineTemplates": typeof crm_pipelineTemplates;
  "helpers/authedFunctions": typeof helpers_authedFunctions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
