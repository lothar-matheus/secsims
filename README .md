🏙️ SecCity - Cyber Defense Simulation

🎯 O Projeto
O SecCity é um simulador de defesa cibernética onde você assume o papel de um Security Manager. O objetivo é proteger uma infraestrutura corporativa contra ataques em tempo real, equilibrando orçamento, investimento em defesa e resposta a incidentes.

🎮 Gameplay & Learning
🏗️ Construa: Implemente Firewalls, SOCs e Backups.

🎯 Responda: Intercepte ataques DDoS manualmente para ganhar bônus.

📊 Analise: Utilize o Dashboard SIEM integrado para métricas de performance (MTTD/MTTR).

💡 Conceitos Reais: Pratique Defense in Depth e Incident Response de forma visual.

🛠️ Tecnologias
Para garantir máxima performance e zero dependências, o projeto foi construído puramente com:

Vanilla JavaScript (ES6+) - Lógica de jogo e motor de renderização.

CSS3 Moderno - Grid 8x8, Flexbox e animações de alta performance.

HTML5 Semântico - Estrutura e acessibilidade.

LocalStorage API - Persistência de recordes e estatísticas.


📖 Documentação Técnica

O projeto segue o padrão MVC (Model-View-Controller) simplificado:

Estado Global: Gerenciado pelo objeto Game.

Game Loops: Intervalos de 50ms para física/movimento e 5s para lógica de negócio (ticks).

Sistemas: Módulos independentes para Cidadãos, Ataques e Grid.

</details>

<details> <summary><b>Funcionalidades do SIEM</b></summary>

O dashboard simula ferramentas reais como Splunk/CrowdStrike:

Timeline de Eventos: Log crítico das últimas 20 ocorrências.

Análise por Tipo: Gráficos dinâmicos de Phishing, Malware, Ransomware e DDoS.

Exportação: Geração de relatórios em .txt para auditoria simulada.

</details>
<details> <summary><b>Tabela de Defesas e ROI</b></summary>
Ferramenta,Custo,Defesa,Renda
🔥 Firewall,150g,+15%,+5g/tick
🏥 Backup,200g,+10%,+8g/tick
🚔 SOC,350g,+30%,+15g/tick
🎓 Treinamento,100g,+12%,+4g/tick
</details>

🚀 Instalação
Bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/seccity.git

# 2. Entre na pasta
cd seccity

# 3. Abra o arquivo index.html no seu navegador preferido.

📄 Licença
Distribuído sob a licença MIT. Veja LICENSE para mais informações.

👤 Desenvolvido por Matheus Lemos
