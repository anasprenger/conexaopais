import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import { brand, button, container, footer, main, text } from "./styles";

interface EmailChangeEmailProps { siteName: string; oldEmail: string; email: string; newEmail: string; confirmationUrl: string }

export const EmailChangeEmail = ({ siteName, oldEmail, newEmail, confirmationUrl }: EmailChangeEmailProps) => (
  <Html lang="pt-BR" dir="ltr"><Head /><Preview>Confirme seu novo e-mail no {siteName}</Preview>
    <Body style={main}><Container style={container}>
      <Text style={brand}>CONEXÃO PAIS</Text>
      <Heading style={{ color: "#43563d", fontSize: "28px" }}>Confirme seu novo e-mail</Heading>
      <Text style={text}>Você pediu a alteração de {oldEmail} para {newEmail}. Confirme para concluir.</Text>
      <Button style={button} href={confirmationUrl}>Confirmar novo e-mail</Button>
      <Text style={footer}>Se você não solicitou esta alteração, proteja sua conta imediatamente.</Text>
    </Container></Body>
  </Html>
);

export default EmailChangeEmail;