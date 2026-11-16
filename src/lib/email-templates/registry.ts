import type { ComponentType } from 'react'
import {
  adminContactTemplate,
  adminProfessionalTemplate,
  professionalAdjustmentsTemplate,
  professionalApprovedTemplate,
  requestReceivedTemplate,
  welcomeTemplate,
} from './app-notifications'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Aviso para a administração: vai sempre para a variável ADMIN_EMAIL. */
  toAdmin?: boolean
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'boas-vindas': welcomeTemplate,
  'solicitacao-profissional-recebida': requestReceivedTemplate,
  'profissional-aprovado': professionalApprovedTemplate,
  'profissional-ajustes': professionalAdjustmentsTemplate,
  'admin-novo-profissional': adminProfessionalTemplate,
  'admin-novo-contato': adminContactTemplate,
}
