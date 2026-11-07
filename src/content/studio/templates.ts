import { templatesA } from './_partTemplatesA';
import { templatesB } from './_partTemplatesB';
import { templatesC } from './_partTemplatesC';

/** Authored templates, ordered as in section 14.1 of the Studio brief. */
export const templates = [...templatesA, ...templatesB, ...templatesC];
export const templateById = new Map(templates.map((template) => [template.id, template]));
