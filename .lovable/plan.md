

## Plano: Proteção Jurídica do Ethra (Atualizado)

### Diagnóstico de Riscos Identificados

Após análise completa do aplicativo, identifiquei **6 categorias de risco jurídico** que precisam ser mitigadas:

---

### 1. Ausência de Termos de Uso e Política de Privacidade

**Situação Atual:**
- O Footer tem links para "Termos de Uso" e "Privacidade" que apontam para `#` (não funcionam)
- Não existe página de termos de uso
- A página `/privacy` trata apenas de permissões técnicas, não de política de privacidade legal

**Riscos:**
- Violação da LGPD (Lei Geral de Proteção de Dados)
- Impossibilidade de defesa legal em disputas
- Multas administrativas (até 2% do faturamento)

**Solução:**
- Criar página `/terms` com Termos de Uso completos
- Criar página `/privacy-policy` com Política de Privacidade LGPD-compliant
- Atualizar links no Footer

---

### 2. Ausência de Consentimento Explícito no Cadastro

**Situação Atual:**
- Página de Auth (`/auth`) permite criar conta sem aceitar termos
- Não há checkbox de consentimento para processamento de dados

**Riscos:**
- Processamento de dados pessoais sem base legal (LGPD Art. 7)
- Usuários podem alegar desconhecimento dos termos

**Solução:**
- Adicionar checkbox obrigatório: "Li e aceito os Termos de Uso e Política de Privacidade"
- Armazenar data/hora do aceite no banco de dados

---

### 3. Disclaimer de IA Ausente

**Situação Atual:**
- Análise cromática usa IA (Gemini) para determinar "estação" do usuário
- Sugestões de looks e moda são geradas por IA
- Provador Virtual usa IA generativa
- **Nenhum disclaimer informa que resultados são gerados por IA**

**Riscos:**
- Usuários podem alegar dano por confiar em "conselho profissional"
- Resultados de colorimetria podem ser contestados
- Expectativas irreais sobre qualidade de virtual try-on

**Solução:**
- Adicionar disclaimer visível antes de análises de IA:
  > "Esta análise é gerada por Inteligência Artificial para fins de entretenimento e autoconhecimento. Não substitui consultoria profissional de imagem."
- Adicionar badge "IA" em resultados gerados automaticamente

---

### 4. Processamento de Imagens Faciais (Biometria)

**Situação Atual:**
- ChromaticCameraCapture captura foto do rosto
- Sistema detecta tom de pele, cor de olhos, cabelo
- Há blur facial opcional, mas não obrigatório
- Dados biométricos podem ser considerados "dados sensíveis" pela LGPD

**Riscos:**
- Dados biométricos têm proteção especial (LGPD Art. 11)
- Vazamento de fotos pode gerar responsabilização

**Solução:**
- Consentimento específico para captura facial
- Informar claramente que fotos são processadas por IA
- Oferecer opção de análise manual (upload) vs. câmera ao vivo
- Explicitar política de retenção (7 dias para temp, nunca para fotos originais)

---

### 5. Ausência de Restrição de Idade

**Situação Atual:**
- Qualquer pessoa pode criar conta
- Não há verificação de idade mínima
- Processamento de dados de menores é proibido sem consentimento parental

**Riscos:**
- LGPD Art. 14: tratamento de dados de crianças requer consentimento dos pais
- Responsabilização por conteúdo inadequado para menores

**Solução:**
- Adicionar declaração de idade no cadastro: "Declaro ter 18 anos ou mais"
- Alternativa: "Declaro ter 13 anos ou mais e consentimento dos responsáveis"
- Armazenar confirmação de idade

---

### 6. Direito à Exclusão de Dados (LGPD Art. 18)

**Situação Atual:**
- Página de Settings não oferece opção de excluir conta
- Não há mecanismo para solicitar exclusão de dados
- Dados podem ficar retidos indefinidamente

**Riscos:**
- Violação do direito à eliminação de dados pessoais
- Usuários não conseguem exercer direitos da LGPD

**Solução:**
- Adicionar botão "Excluir minha conta e dados" em Settings
- Criar Edge Function para exclusão completa de dados
- Enviar confirmação por email
- Reter apenas dados necessários por obrigação legal (fiscal, etc.)

---

### Arquivos a Criar

| Arquivo | Descrição |
|---------|-----------|
| `src/pages/Terms.tsx` | Página de Termos de Uso completos |
| `src/pages/PrivacyPolicy.tsx` | Política de Privacidade LGPD |
| `src/components/legal/ConsentCheckbox.tsx` | Checkbox de consentimento reutilizável |
| `src/components/legal/AIDisclaimer.tsx` | Banner de disclaimer de IA |
| `supabase/functions/delete-user-data/index.ts` | Edge Function para exclusão LGPD |

---

### Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Auth.tsx` | Adicionar checkbox de termos e confirmação de idade |
| `src/components/landing/Footer.tsx` | Corrigir links para páginas legais |
| `src/pages/Settings.tsx` | Adicionar opção de exclusão de conta |
| `src/App.tsx` | Adicionar rotas para `/terms` e `/privacy-policy` |
| `src/components/chromatic/ColorAnalysisResult.tsx` | Adicionar disclaimer de IA |
| `src/pages/VirtualTryOn.tsx` | Adicionar disclaimer antes do provador |

---

### Mudanças no Banco de Dados

```sql
-- Armazenar consentimentos do usuário
ALTER TABLE profiles ADD COLUMN terms_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN privacy_accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN age_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN age_confirmed_at TIMESTAMP WITH TIME ZONE;
```

---

### Estrutura dos Termos de Uso (Resumo)

1. **Identificação do Responsável** - Nome da empresa, CNPJ, endereço
2. **Natureza do Serviço** - Descrição do Ethra como ferramenta de autoconhecimento
3. **Limitação de Responsabilidade** - IA não substitui profissionais
4. **Uso de Imagens** - Política de processamento e retenção
5. **Propriedade Intelectual** - Direitos sobre conteúdo gerado
6. **Modificações** - Direito de alterar termos
7. **Foro** - Jurisdição para disputas

---

### Estrutura da Política de Privacidade (LGPD)

1. **Controlador dos Dados** - Quem é responsável
2. **Dados Coletados** - Lista completa (email, fotos, preferências)
3. **Finalidade** - Por que coletamos cada dado
4. **Base Legal** - Consentimento, legítimo interesse, contrato
5. **Compartilhamento** - Terceiros (Google AI, armazenamento)
6. **Retenção** - Por quanto tempo guardamos
7. **Direitos do Titular** - Acesso, correção, exclusão
8. **Contato do DPO** - Email para solicitações

---

### Prioridade de Implementação

| Prioridade | Item | Urgência |
|------------|------|----------|
| 🔴 Alta | Termos de Uso e Política de Privacidade | Crítico |
| 🔴 Alta | Checkbox de consentimento no cadastro | Crítico |
| 🟠 Média | Disclaimer de IA | Importante |
| 🟠 Média | Confirmação de idade | Importante |
| 🟡 Baixa | Exclusão de conta | Recomendado |

---

### Resultado Esperado

Após implementação:
- Conformidade com LGPD
- Proteção contra ações judiciais de usuários
- Expectativas claras sobre uso de IA
- Mecanismo de exclusão de dados funcional

