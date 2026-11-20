/**
 * MATÉRIA — as palavras que dizem de que negócio a pessoa fala (português, inglês e espanhol, já
 * sem acento e em minúsculas). Compartilhado entre o servidor (data/materia.ts tira essas palavras do
 * índice dos cases, para um termo genérico como "turismo" não escolher um case sozinho) e o cliente
 * (features/os/materia/brain.ts lê a frase com elas).
 *
 *   SECTOR_CUES   o tipo de site: uma palavra dessas vale como sinal forte do setor
 *   FIELD_CUES    um ramo dentro do setor, com referência e prévia próprias (mergulho, psicologia)
 *   PREMISES      "loja", "shop", "store", "tienda": dizem onde o negócio funciona, não o que ele quer
 *                 do site ("dive shop", "coffee shop") — sinal fraco de comércio
 *   COMPANY       "empresa", "company": genérico — só indica site institucional quando está sozinho
 */
export type SectorId = "health" | "tourism" | "landing" | "store" | "system" | "food" | "immersive" | "company";
export type FieldId = "diving" | "psychology";

export const SECTOR_CUES: { id: SectorId; test: RegExp; words: string[]; /** Formato de entrega, não ramo: perde para um ramo citado na mesma frase. */ format?: boolean }[] = [
  { id: "health", test: /\b(psicolog\w*|psycholog\w*|psiquiatr\w*|psychiatr\w*|terap\w*|therap\w*|consultorio\w*|clinic\w*|dentist\w*|odonto\w*|medic[oa]s?|doctor\w*|doutor\w*|nutri\w*|fisio\w*|physio\w*|saude|health\w*|salud|estetic\w*|fonoaudi\w*)\b/, words: ["psicologa", "psicologo", "psychologist", "terapeuta", "therapist", "dentista", "consultorio", "clinica"] },
  { id: "tourism", test: /\b(turism\w*|tourism|tours?|passeio\w*|viage\w*|travel\w*|safari\w*|guias? (local|turistic)\w*|tour guide\w*|hotel\w*|hoteis|pousada\w*|hostel\w*|mergulh\w*|diving|transfer\w*|excurs\w*|viaje\w*|turist\w*)\b/, words: ["turismo", "tourism", "passeios", "viagens", "pousada"] },
  { id: "landing", format: true, test: /\b(landing\w*|pagina de venda\w*|sales page|anuncio\w*|ads|campanha\w*|campaign\w*|lancamento\w*|one page|pagina unica)\b/, words: ["landing"] },
  { id: "store", test: /\b(e ?commerce|lojas? (virtual|virtuais|online)|online (store|shop)s?|tiendas? (virtual|online|en linea)|vender online|sell online|vender en linea|catalogo\w*|catalogue\w*|catalog|checkout|carrinho|shopping cart)\b/, words: ["ecommerce", "catalogo"] },
  { id: "system", test: /\b(sistema\w*|systems?|painel|paineis|dashboard\w*|crm|erp|saas|software|aplicativo\w*|plataforma\w*|platform\w*|planilha\w*|spreadsheet\w*)\b/, words: ["sistema", "dashboard", "plataforma"] },
  { id: "food", test: /\b(cafes?|coffee|cafeteria\w*|restaurante\w*|restaurant\w*|padaria\w*|bakery|gastronom\w*|laticin\w*|torrefac\w*)\b/, words: ["restaurante", "cafeteria", "padaria"] },
  { id: "immersive", format: true, test: /\b(3d|webgl|imersiv\w*|immersive|inmersiv\w*|cinematic\w*|cinematograf\w*|impacto visual|visual impact)\b/, words: ["imersivo", "immersive"] },
  { id: "company", test: /\b(institucional\w*|corporate|escritorio\w*|advog\w*|lawyer\w*|law firm|abogad\w*|arquitet\w*|architect\w*|arquitect\w*|engenharia|contab\w*|accountan\w*|consultoria\w*|industria\w*|construtora\w*)\b/, words: ["institucional", "escritorio", "advogado", "arquiteto"] },
];

export const FIELD_CUES: { id: FieldId; sector: SectorId; test: RegExp; words: string[] }[] = [
  { id: "diving", sector: "tourism", test: /\b(dive|dives|diving|divers?|scuba|snorkel\w*|mergulh\w*|buce\w*|submarinis\w*|freediv\w*|apneia|apnea)\b/, words: ["mergulho", "diving", "buceo", "scuba", "snorkel"] },
  { id: "psychology", sector: "health", test: /\b(psicolog\w*|psycholog\w*|terap\w*|therap\w*|psiquiatr\w*|psychiatr\w*|psicanal\w*|psychoanal\w*)\b/, words: ["psicologa", "psicologo", "psychologist", "terapeuta", "therapist"] },
];

export const PREMISES = /\b(lojas?|shops?|stores?|tiendas?|boutiques?)\b/;
/** "Empresa", "company": qualquer negócio é uma. Só vale como site institucional quando a frase não diz mais nada. */
export const COMPANY = /\b(empresas?|company|companies|compania\w*)\b/;

export const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
