# Library Conversion Roadmap

## Current Status: ~40% Complete

### ✅ Completed (Week 1 - Security)
- [x] Security audit and documentation
- [x] CSS sanitizer implementation
- [x] Input validator implementation
- [x] Basic security testing

### 📋 Remaining Work

## Week 2: Library Structure (5-7 days)
**Estimated Time: 25-35 hours**

### Day 1: Design Package Structure
- [ ] Create `packages/ai-theme-library/` directory
- [ ] Create subdirectories: `src/`, `dist/`, `tests/`, `docs/`
- [ ] Create `package.json` with proper metadata
- [ ] Design public API in `docs/API_DESIGN.md`
- [ ] Create README for library

**Time**: 3-4 hours

### Day 2-3: Extract Core Code
- [ ] Copy `lib/color-extraction.ts` → `packages/ai-theme-library/src/extractors/`
- [ ] Extract theme generation logic from `app/api/theme/route.ts`
- [ ] Extract CSS sanitizer → `packages/ai-theme-library/src/security/`
- [ ] Extract input validator → `packages/ai-theme-library/src/security/`
- [ ] Remove Next.js-specific code (API routes, server components)
- [ ] Create adapter layer for different frameworks
- [ ] Create clean `index.ts` with public API exports

**Time**: 8-10 hours

### Day 4: Setup Build Tools
- [ ] Install build dependencies: `typescript`, `tsup`, `vitest`
- [ ] Create `tsconfig.json` for library
- [ ] Create `tsup.config.ts` for building (ESM + CJS)
- [ ] Add build scripts to `package.json`
- [ ] Test build: `npm run build`
- [ ] Configure TypeScript declarations

**Time**: 3-4 hours

### Day 5: Initial Testing
- [ ] Create basic test file structure
- [ ] Test color extraction
- [ ] Test CSS sanitization
- [ ] Test input validation
- [ ] Test theme generation (mock LLM)
- [ ] Fix any issues

**Time**: 3-4 hours

## Week 3: Multi-LLM Support (5-7 days)
**Estimated Time: 30-40 hours**

### Day 1-2: LLM Provider Abstraction
- [ ] Create `src/providers/` directory
- [ ] Create base `LLMProvider` interface
- [ ] Implement `GeminiProvider` (extract from current code)
- [ ] Implement `OpenAIProvider` (GPT-4, GPT-3.5)
- [ ] Implement `PerplexityProvider`
- [ ] Create provider factory/registry

**Time**: 8-10 hours

### Day 3-4: Additional LLM Providers
- [ ] Implement `AnthropicProvider` (Claude 3.5 Sonnet, Opus)
- [ ] Implement `CohereProvider` (Command R+)
- [ ] Implement `MistralProvider` (Mistral Large)
- [ ] Implement `GroqProvider` (fast inference)
- [ ] Add provider configuration system
- [ ] Add model selection UI component

**Time**: 8-10 hours

### Day 5: LLM Integration & Testing
- [ ] Create unified API for all providers
- [ ] Implement fallback mechanism (try provider A, fallback to B)
- [ ] Add rate limiting per provider
- [ ] Add error handling and retries
- [ ] Test all providers
- [ ] Update documentation

**Time**: 6-8 hours

## Week 4: Framework Adapters (3-5 days)
**Estimated Time: 20-30 hours**

### Day 1-2: React Adapter
- [ ] Create `adapters/react/` directory
- [ ] Create React hooks (`useTheme`, `useThemeGenerator`)
- [ ] Create React components (`ThemeProvider`, `ThemeChat`)
- [ ] Extract React-specific code from current app
- [ ] Create example React app

**Time**: 8-10 hours

### Day 3: Vue Adapter
- [ ] Create `adapters/vue/` directory
- [ ] Create Vue composables (`useTheme`, `useThemeGenerator`)
- [ ] Create Vue components
- [ ] Create example Vue app

**Time**: 6-8 hours

### Day 4: Vanilla JS Adapter
- [ ] Create `adapters/vanilla/` directory
- [ ] Create vanilla JS API
- [ ] Create example vanilla JS app

**Time**: 4-6 hours

### Day 5: Documentation & Examples
- [ ] Create comprehensive README
- [ ] Create API documentation
- [ ] Create usage examples for each framework
- [ ] Create migration guide from current app

**Time**: 4-6 hours

## Week 5: Polish & Publish (3-5 days)
**Estimated Time: 15-25 hours**

### Day 1-2: Testing & Quality
- [ ] Write comprehensive test suite
- [ ] Add integration tests
- [ ] Add E2E tests
- [ ] Fix bugs and edge cases
- [ ] Performance optimization

**Time**: 8-10 hours

### Day 3: Documentation
- [ ] Complete API documentation
- [ ] Create getting started guide
- [ ] Create advanced usage guide
- [ ] Create troubleshooting guide
- [ ] Add JSDoc comments to all exports

**Time**: 4-6 hours

### Day 4: Publishing Prep
- [ ] Set up CI/CD pipeline
- [ ] Configure npm publishing
- [ ] Create changelog
- [ ] Version management
- [ ] License and legal

**Time**: 3-4 hours

### Day 5: Launch
- [ ] Publish to npm
- [ ] Create GitHub release
- [ ] Announce on social media/forums
- [ ] Monitor for issues

**Time**: 2-3 hours

---

## Total Estimated Time: 90-130 hours (2.5-3.5 months part-time)

## Recommended LLM Providers

### Tier 1: Essential (Implement First)
1. **OpenAI** - GPT-4, GPT-3.5 Turbo
   - Best overall quality
   - Most popular
   - Good documentation

2. **Anthropic** - Claude 3.5 Sonnet, Claude Opus
   - Excellent for long context
   - Great safety features
   - Strong reasoning

3. **Google Gemini** - Gemini Pro, Gemini Ultra
   - Already implemented
   - Good multimodal support
   - Competitive pricing

### Tier 2: High Value (Implement Second)
4. **Perplexity** - Sonar, Llama 3.1
   - Great for research/context
   - Good API
   - Fast responses

5. **Mistral AI** - Mistral Large, Mixtral
   - Open source options
   - Good performance
   - Competitive pricing

6. **Cohere** - Command R+
   - Good for structured outputs
   - Strong RAG capabilities
   - Enterprise features

### Tier 3: Specialized (Optional)
7. **Groq** - Llama 3, Mixtral
   - Extremely fast inference
   - Good for real-time apps
   - Limited model selection

8. **Together AI** - Multiple open models
   - Open source models
   - Flexible pricing
   - Good for experimentation

9. **Anyscale** - Llama 3, Mistral
   - Open source focus
   - Good performance
   - Competitive pricing

## Implementation Priority

1. **Phase 1** (Week 3): OpenAI, Perplexity, Anthropic
2. **Phase 2** (Week 4): Mistral, Cohere
3. **Phase 3** (Future): Groq, Together AI, Anyscale

## Key Decisions Needed

1. **Package Structure**: Monorepo vs single package?
2. **Framework Support**: React first, then Vue/Vanilla?
3. **LLM Provider**: Which providers to prioritize?
4. **Pricing Model**: Free tier? Paid features?
5. **Distribution**: npm only? Also CDN?

## Next Steps

1. Start with Week 2 (Library Structure)
2. Implement OpenAI and Perplexity providers
3. Create React adapter first
4. Test thoroughly before publishing

