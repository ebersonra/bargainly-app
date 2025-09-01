/**
 * Simple View Engine for rendering templates
 * Supports basic templating with {{variable}} syntax
 */
class ViewEngine {
    constructor() {
        this.templateCache = new Map();
        this.componentsCache = new Map();
    }

    /**
     * Load and cache template
     */
    async loadTemplate(templatePath) {
        console.log('ViewEngine loadTemplate:', templatePath);
        
        if (this.templateCache.has(templatePath)) {
            console.log('ViewEngine template encontrado no cache:', templatePath);
            return this.templateCache.get(templatePath);
        }

        try {
            const fullPath = `/static/templates/${templatePath}.html`;
            console.log('ViewEngine tentando carregar:', fullPath);
            
            const response = await fetch(fullPath);
            if (!response.ok) {
                throw new Error(`Template not found: ${fullPath} (${response.status})`);
            }
            
            const template = await response.text();
            console.log('ViewEngine template carregado:', templatePath, 'conteúdo:', template.substring(0, 100) + '...');
            
            this.templateCache.set(templatePath, template);
            return template;
        } catch (error) {
            console.error('ViewEngine erro ao carregar template:', templatePath, error);
            return `<div class="error">Template not found: ${templatePath}</div>`;
        }
    }

    /**
     * Render template with data
     * IMPORTANT: Block helpers (each, if, unless) are processed BEFORE variable substitution
     * to ensure loop variables like {{name}} and {{price}} inside {{#each items}} blocks render correctly.
     */
    render(template, data = {}) {
        let rendered = template;

        // STEP 1: Handle {{#each array}} loops FIRST (before variable replacement)
        // This ensures variables inside loops get the correct context
        rendered = rendered.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, content) => {
            const array = data[arrayKey] || [];
            return array.map(item => this.render(content, item)).join('');
        });

        // STEP 2: Handle {{#if condition}} blocks
        rendered = rendered.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
            const value = data[condition];
            return value ? this.render(content, data) : '';
        });

        // STEP 3: Handle {{#unless condition}} blocks
        rendered = rendered.replace(/\{\{#unless ([\w.]+)\}\}([\s\S]*?)\{\{\/unless\}\}/g, (match, condition, content) => {
            const value = this.getNestedValue(data, condition);
            return (!value || (Array.isArray(value) && value.length === 0)) ? this.render(content, data) : '';
        });

        // STEP 4: Handle {{> partial}} includes (simplified)
        rendered = rendered.replace(/\{\{> ([\w-]+).*?\}\}/g, (match, partialName) => {
            return `<!-- Partial: ${partialName} -->`;
        });

        // STEP 5: Replace {{variable}} with data values LAST (after all block processing)
        // This ensures that variables inside blocks get processed with the correct context
        rendered = rendered.replace(/\{\{(\w+)\}\}/g, (match, key) => {
            return data[key] !== undefined ? data[key] : '';
        });

        return rendered;
    }

    /**
     * Get nested object value (e.g., "markets.length")
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Render view with data
     */
    async renderView(viewPath, data = {}) {
        const template = await this.loadTemplate(viewPath);
        return this.render(template, data);
    }
}

// Export for browser and Node.js
if (typeof window !== 'undefined') {
    window.ViewEngine = ViewEngine;
    window.viewEngine = new ViewEngine();
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewEngine;
}
