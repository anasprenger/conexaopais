import * as React from "react";
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import { brand, button, container, footer, main, text } from "./styles";

interface SignupEmailProps {
  siteName: string;
  confirmationUrl: string;
}

export const SignupEmail = ({ siteName, confirmationUrl }: SignupEmailProps) => (
  <Html lang="pt-BR" dir="ltr">
    <Head />
    <Preview>Confirme seu cadastro no {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>CONEXÃO PAIS</Text>
        <Heading style={{ color: "#43563d", fontSize: "28px" }}>Confirme seu cadastro</Heading>
        <Text style={text}>
          Falta apenas confirmar seu e-mail para acessar sua conta e participar do Conexão Pais.
        </Text>
        <Button style={button} href={confirmationUrl}>Confirmar meu e-mail</Button>
        <Text style={footer}>Se você não criou esta conta, ignore esta mensagem com segurança.</Text>
      </Container>
    </Body>
  </Html>
);

export default SignupEmail;