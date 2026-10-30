import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { TemplateEntry } from "./registry";
import { brand, button, container, detail, footer, main, text } from "./styles";

const SITE_URL = "https://conexaopais.com.br";

function Frame({ preview, title, children, action, actionLabel }: { preview: string; title: string; children: React.ReactNode; action?: string; actionLabel?: string }) {
  return <Html lang="pt-BR" dir="ltr"><Head /><Preview>{preview}</Preview><Body style={main}><Container style={container}>
    <Text style={brand}>CONEXÃO PAIS</Text><Heading style={{ color: "#43563d", fontSize: "28px" }}>{title}</Heading>
    {children}{action && actionLabel ? <Button style={button} href={action}>{actionLabel}</Button> : null}
    <Text style={footer}>Conexão Pais — Ajudando a unir famílias e gerações.</Text>
  </Container></Body></Html>;
}

function Welcome({ name }: { name?: string }) {
  return <Frame preview="Boas-vindas ao Conexão Pais" title={`Boas-vindas${name ? `, ${name}` : ""}!`} action={`${SITE_URL}/minha-conta`} actionLabel="Conhecer minha conta">
    <Text style={text}>Sua conta está confirmada. Agora você pode salvar conteúdos, participar das conversas e acompanhar informações para famílias e responsáveis.</Text>
  </Frame>;
}

function RequestReceived({ name, profession, requestId }: { name?: string; profession: string; requestId: string }) {
  return <Frame preview="Recebemos sua solicitação profissional" title="Solicitação recebida" action={`${SITE_URL}/seja-profissional`} actionLabel="Acompanhar solicitação">
    <Text style={text}>{name ? `Olá, ${name}. ` : ""}Recebemos seus dados profissionais e eles estão em análise.</Text>
    <Text style={detail}>Profissão: {profession}<br />Protocolo: {requestId}</Text>
  </Frame>;
}

function ProfessionalApproved({ name }: { name?: string }) {
  return <Frame preview="Seu cadastro profissional foi aprovado" title="Cadastro profissional aprovado" action={`${SITE_URL}/minha-conta`} actionLabel="Acessar minha conta">
    <Text style={text}>{name ? `${name}, seu` : "Seu"} perfil foi aprovado. O acesso para publicar artigos e posts já está liberado.</Text>
  </Frame>;
}

function ProfessionalAdjustments({ name, observation }: { name?: string; observation: string }) {
  return <Frame preview="Seu cadastro profissional precisa de ajustes" title="Precisamos de alguns ajustes" action={`${SITE_URL}/seja-profissional`} actionLabel="Revisar solicitação">
    <Text style={text}>{name ? `${name}, revise` : "Revise"} as orientações abaixo para continuarmos a análise.</Text>
    <Text style={detail}>{observation}</Text>
  </Frame>;
}

function AdminProfessional({ name, profession, registration, email, phone, requestId }: { name: string; profession: string; registration: string; email: string; phone: string; requestId: string }) {
  return <Frame preview="Novo profissional aguardando análise" title="Novo profissional aguardando análise" action={`${SITE_URL}/admin/profissionais`} actionLabel="Analisar solicitação">
    <Text style={detail}>Nome: {name}<br />Profissão: {profession}<br />Registro: {registration}<br />E-mail: {email}<br />Telefone: {phone}<br />Protocolo: {requestId}</Text>
  </Frame>;
}

function AdminContact({ name, email, subject, message, messageId }: { name: string; email: string; subject?: string; message: string; messageId: string }) {
  return <Frame preview="Nova mensagem recebida pelo site" title="Nova mensagem de contato">
    <Text style={detail}>Nome: {name}<br />E-mail: {email}<br />Assunto: {subject || "Não informado"}<br />Referência: {messageId}</Text>
    <Text style={text}>{message}</Text>
  </Frame>;
}

export const welcomeTemplate = { component: Welcome, subject: "Boas-vindas ao Conexão Pais", displayName: "Boas-vindas", previewData: { name: "Ana" } } satisfies TemplateEntry;
export const requestReceivedTemplate = { component: RequestReceived, subject: "Recebemos sua solicitação profissional", displayName: "Solicitação profissional recebida", previewData: { name: "Ana", profession: "Psicóloga", requestId: "00000000" } } satisfies TemplateEntry;
export const professionalApprovedTemplate = { component: ProfessionalApproved, subject: "Seu cadastro profissional foi aprovado", displayName: "Profissional aprovado", previewData: { name: "Ana" } } satisfies TemplateEntry;
export const professionalAdjustmentsTemplate = { component: ProfessionalAdjustments, subject: "Ajustes necessários no seu cadastro profissional", displayName: "Ajustes no cadastro profissional", previewData: { name: "Ana", observation: "Revise os dados informados no cadastro profissional." } } satisfies TemplateEntry;
export const adminProfessionalTemplate = { component: AdminProfessional, subject: "Novo profissional aguardando análise", displayName: "Novo profissional para análise", to: "anasprenger137@gmail.com", previewData: { name: "Ana", profession: "Psicóloga", registration: "CRP 00/00000", email: "ana@example.com", phone: "(00) 00000-0000", requestId: "00000000" } } satisfies TemplateEntry;
export const adminContactTemplate = { component: AdminContact, subject: ({ subject }) => subject ? `Contato: ${String(subject)}` : "Nova mensagem de contato", displayName: "Nova mensagem de contato", to: "anasprenger137@gmail.com", previewData: { name: "Ana", email: "ana@example.com", subject: "Dúvida", message: "Mensagem enviada pelo formulário.", messageId: "00000000" } } satisfies TemplateEntry;