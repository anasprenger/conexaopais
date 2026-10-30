import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import { brand, button, container, footer, main, text } from "./styles";

interface InviteEmailProps { siteName: string; confirmationUrl: string }

export const InviteEmail = ({ siteName, confirmationUrl }: InviteEmailProps) => (
  <Html lang="pt-BR" dir="ltr"><Head /><Preview>Você recebeu um convite do {siteName}</Preview>
    <Body style={main}><Container style={container}>
      <Text style={brand}>CONEXÃO PAIS</Text>
      <Heading style={{ color: "#43563d", fontSize: "28px" }}>Você recebeu um convite</Heading>
      <Text style={text}>Aceite o convite para criar sua conta e fazer parte desta comunidade de famílias e profissionais.</Text>
      <Button style={button} href={confirmationUrl}>Aceitar convite</Button>
      <Text style={footer}>Se não esperava este convite, ignore esta mensagem.</Text>
    </Container></Body>
  </Html>
);

export default InviteEmail;