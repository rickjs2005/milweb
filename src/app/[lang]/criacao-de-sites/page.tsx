import { serviceRoute } from "@/lib/service-route";

const route = serviceRoute("criacao-de-sites");
export const generateMetadata = route.generateMetadata;
export default route.Page;
