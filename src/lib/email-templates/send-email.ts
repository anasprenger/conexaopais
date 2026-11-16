import * as React from 'react'
import { render } from '@react-email/render'
import { TEMPLATES } from './registry'

// Somente no servidor: lê RESEND_API_KEY e ADMIN_EMAIL. Nunca importar em componentes do navegador.
//
// Variáveis de ambiente (painel da Hostinger):
//   RESEND_API_KEY  chave da API do Resend (obrigatória para enviar)
//   ADMIN_EMAIL     quem recebe os avisos de novo profissional e de contato
//   EMAIL_FROM      remetente (opcional). Padrão: "Conexão Pais <nao-responda@conexaopais.com>"
//   EMAIL_REPLY_TO  endereço de resposta (opcional). Padrão: "contato@conexaopais.com"

const DEFAULT_FROM = 'Conexão Pais <nao-responda@conexaopais.com>'
const DEFAULT_REPLY_TO = 'contato@conexaopais.com'

export type SendTemplateEmailResult = { sent: true }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  /** Evita envio duplicado quando a mesma ação é repetida. */
  idempotencyKey?: string
  replyTo?: string
}

/**
 * Monta o modelo de email registrado e envia pela API do Resend.
 * Qualquer falha gera um erro (quem chama decide se ignora).
 */
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const apiKey = process.env['RESEND_API_KEY']
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`
    )
  }

  // Avisos para a administração vão sempre para ADMIN_EMAIL.
  const recipient = template.toAdmin ? process.env['ADMIN_EMAIL'] : to
  if (!recipient) {
    throw new Error(
      template.toAdmin ? 'ADMIN_EMAIL is not configured' : 'Recipient is required'
    )
  }

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = await render(element)
  const text = await render(element, { plainText: true })
  const subject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.idempotencyKey ? { 'Idempotency-Key': options.idempotencyKey.slice(0, 256) } : {}),
    },
    body: JSON.stringify({
      from: process.env['EMAIL_FROM'] || DEFAULT_FROM,
      to: [recipient],
      reply_to: options.replyTo || process.env['EMAIL_REPLY_TO'] || DEFAULT_REPLY_TO,
      subject,
      html,
      text,
      tags: [{ name: 'template', value: templateName.replace(/[^a-zA-Z0-9_-]/g, '_') }],
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend ${response.status}: ${body.slice(0, 300)}`)
  }

  return { sent: true }
}
