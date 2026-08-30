set -e
cd "C:/Users/rickj/projetos/milweb"
taskkill //F //IM node.exe >/dev/null 2>&1 || true; sleep 2
echo "=== BUILD compiler"; pnpm build > scripts/.rsc-audit/build-compiler.log 2>&1; grep -E "^├ ● /\[lang\]\s|/\[lang\]/lab/milo-null|shared by all" scripts/.rsc-audit/build-compiler.log | head -3
du -sk .next/static/chunks | cut -f1 | xargs echo "static chunks KB:"
MW_LOCAL_HTTP=1 nohup pnpm start -p 3000 > scripts/.rsc-audit/server.log 2>&1 &
sleep 7; node scripts/.rsc-audit/hero-milo.mjs compiler-prod http://127.0.0.1:3000 2>&1 | grep -E "^==" | cut -c1-330
taskkill //F //IM node.exe >/dev/null 2>&1 || true; sleep 2
echo "=== BUILD milo"; NEXT_PUBLIC_HERO_VISUAL=milo pnpm build > scripts/.rsc-audit/build-milo.log 2>&1; grep -E "^├ ● /\[lang\]\s|shared by all" scripts/.rsc-audit/build-milo.log | head -3
du -sk .next/static/chunks | cut -f1 | xargs echo "static chunks KB:"
MW_LOCAL_HTTP=1 nohup pnpm start -p 3000 > scripts/.rsc-audit/server.log 2>&1 &
sleep 7; node scripts/.rsc-audit/hero-milo.mjs milo-prod http://127.0.0.1:3000 2>&1 | grep -E "^==" | cut -c1-330
taskkill //F //IM node.exe >/dev/null 2>&1 || true
echo "=== LINT"; pnpm lint > scripts/.rsc-audit/lint.log 2>&1; echo "lint exit $?"; grep -c "Error" scripts/.rsc-audit/lint.log || true
