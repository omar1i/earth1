<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Application architecture
- Keep all bilingual public content, configurable experiences, categories, pricing, and destination associations in the central content module; optional unconfigured information stays hidden to avoid unsupported claims.
- Use the shared language context for public copy and document direction, so language changes survive navigation and align all controls consistently.
- Use separate TanStack content routes with leaf-specific metadata and outlet-only parent routes, so every public page remains shareable and server-rendered.
- Submit booking inquiries through a validated server function using a publishable client and insert-only RLS; inquiries intentionally have no account ownership and visitors must never receive customer read access.
- Use a cryptographically random per-submission reference as the idempotency key and record ID; retries reuse it to prevent duplicate request records without public read policies.
