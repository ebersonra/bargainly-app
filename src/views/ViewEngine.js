/**
 * Simple View Engine for rendering templates
 * Supports basic templating with {{variable}} syntax
 */
class ViewEngine {
    constructor() {
        this.templateCache = new Map();
        this.componentsCache = new Map();
        this.renderMetrics = {
            totalRenders: 0,
            maxDepth: 0,
            avgRenderTime: 0
        };
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
    render(template, data = {}, depth = 0) {
        // Prevent infinite recursion and stack overflow
        const MAX_RECURSION_DEPTH = 50;
        if (depth > MAX_RECURSION_DEPTH) {
            console.warn(`ViewEngine: Maximum recursion depth (${MAX_RECURSION_DEPTH}) exceeded. Template rendering stopped to prevent stack overflow.`);
            return template; // Return template as-is to prevent data loss
        }

        let rendered = template;

        // STEP 1: Handle {{#each array}} loops FIRST (before variable replacement)
        // This ensures variables inside loops get the correct context
        rendered = rendered.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, content) => {
            const array = data[arrayKey] || [];
            
            // Performance optimization: Limit array size to prevent exponential blowup
            const MAX_ARRAY_SIZE = 1000;
            if (array.length > MAX_ARRAY_SIZE) {
                console.warn(`ViewEngine: Array size (${array.length}) exceeds maximum (${MAX_ARRAY_SIZE}). Only first ${MAX_ARRAY_SIZE} items will be rendered.`);
            }
            
            const limitedArray = array.slice(0, MAX_ARRAY_SIZE);
            return limitedArray.map(item => this.render(content, item, depth + 1)).join('');
        });

        // STEP 2: Handle {{#if condition}} blocks with proper nesting support
        rendered = this.processBlockHelper(rendered, 'if', (condition, content, data) => {
            const value = this.getNestedValue(data, condition);
            return value ? this.render(content, data, depth + 1) : '';
        }, data);

        // STEP 3: Handle {{#unless condition}} blocks with proper nesting support
        rendered = this.processBlockHelper(rendered, 'unless', (condition, content, data) => {
            const value = this.getNestedValue(data, condition);
            return (!value || (Array.isArray(value) && value.length === 0)) ? this.render(content, data, depth + 1) : '';
        }, data);

        // STEP 4: Handle {{> partial}} includes (simplified)
        rendered = rendered.replace(/\{\{> ([\w-]+).*?\}\}/g, (match, partialName) => {
            return `<!-- Partial: ${partialName} -->`;
        });

        // STEP 5: Replace {{variable}} with data values LAST (after all block processing)
        // This ensures that variables inside blocks get processed with the correct context
        // HTML escaping is applied by default to prevent XSS vulnerabilities
        rendered = this.replaceVariables(rendered, data, true);

        return rendered;
    }

    /**
     * Get nested object value (e.g., "markets.length")
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Process block helpers with proper nesting support
     * This handles nested blocks correctly by counting opening and closing tags
     */
    processBlockHelper(template, helperName, processor, data) {
        let result = template;
        const openTag = `{{#${helperName} `;
        const closeTag = `{{/${helperName}}}`;
        
        // Keep processing until no more helpers are found
        let changed = true;
        while (changed) {
            changed = false;
            
            // Find the first opening tag
            let openIndex = result.indexOf(openTag);
            if (openIndex === -1) break;
            
            // Find the condition (everything between opening tag and }})
            const conditionStart = openIndex + openTag.length;
            const conditionEnd = result.indexOf('}}', conditionStart);
            if (conditionEnd === -1) break;
            
            const condition = result.substring(conditionStart, conditionEnd);
            const contentStart = conditionEnd + 2;
            
            // Find the matching closing tag by counting nesting levels
            let level = 1;
            let pos = contentStart;
            let contentEnd = -1;
            
            while (pos < result.length && level > 0) {
                const nextOpen = result.indexOf(openTag, pos);
                const nextClose = result.indexOf(closeTag, pos);
                
                if (nextClose === -1) break; // No closing tag found
                
                if (nextOpen !== -1 && nextOpen < nextClose) {
                    // Found another opening tag
                    level++;
                    pos = nextOpen + openTag.length;
                } else {
                    // Found a closing tag
                    level--;
                    if (level === 0) {
                        contentEnd = nextClose;
                    }
                    pos = nextClose + closeTag.length;
                }
            }
            
            if (contentEnd === -1) break; // No matching closing tag
            
            // Extract the content and process it
            const content = result.substring(contentStart, contentEnd);
            const processed = processor(condition, content, data);
            
            // Replace the entire block with the processed content
            const fullBlockStart = openIndex;
            const fullBlockEnd = contentEnd + closeTag.length;
            result = result.substring(0, fullBlockStart) + processed + result.substring(fullBlockEnd);
            changed = true;
        }
        
        return result;
    }

    /**
     * HTML escape function to prevent XSS vulnerabilities
     * Escapes dangerous HTML characters in user-provided content
     */
    escapeHtml(unsafe) {
        if (unsafe === null || unsafe === undefined) {
            return '';
        }
        
        // Convert to string if not already
        const str = String(unsafe);
        
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    /**
     * Process variable replacement with HTML escaping
     * Supports both escaped {{variable}} and unescaped {{{variable}}} syntax
     */
    replaceVariables(template, data, escapeByDefault = true) {
        let result = template;
        
        // First, handle unescaped variables {{{variable}}} - these bypass HTML escaping
        result = result.replace(/\{\{\{(\w+(?:\.\w+)*)\}\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key);
            return value !== undefined ? String(value) : '';
        });
        
        // Then handle regular variables {{variable}} - these are HTML escaped by default
        result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
            const value = this.getNestedValue(data, key);
            if (value === undefined) {
                return '';
            }
            
            // HTML escape by default unless disabled
            return escapeByDefault ? this.escapeHtml(value) : String(value);
        });
        
        return result;
    }

    /**
     * Safe render with performance monitoring and depth tracking
     */
    safeRender(template, data = {}, depth = 0) {
        const startTime = performance.now ? performance.now() : Date.now();
        
        try {
            const result = this.render(template, data, depth);
            
            // Update metrics
            this.renderMetrics.totalRenders++;
            this.renderMetrics.maxDepth = Math.max(this.renderMetrics.maxDepth, depth);
            
            const renderTime = (performance.now ? performance.now() : Date.now()) - startTime;
            this.renderMetrics.avgRenderTime = (this.renderMetrics.avgRenderTime + renderTime) / 2;
            
            // Warn about performance issues
            if (renderTime > 100) { // More than 100ms
                console.warn(`ViewEngine: Slow render detected (${renderTime.toFixed(2)}ms) at depth ${depth}`);
            }
            
            return result;
        } catch (error) {
            console.error('ViewEngine: Render error at depth', depth, error);
            return `<div class="error">Render error: ${error.message}</div>`;
        }
    }

    /**
     * Iterative rendering for large datasets to prevent stack overflow
     * This method handles {{#each}} loops iteratively instead of recursively
     */
    renderIterative(template, data = {}) {
        let rendered = template;
        const MAX_ITERATIONS = 1000;
        let iterations = 0;
        
        // Handle nested loops iteratively
        while (rendered.includes('{{#each') && iterations < MAX_ITERATIONS) {
            const beforeRender = rendered;
            
            // Process one level of each loops
            rendered = rendered.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayKey, content) => {
                const array = data[arrayKey] || [];
                const MAX_ARRAY_SIZE = 1000;
                
                if (array.length > MAX_ARRAY_SIZE) {
                    console.warn(`ViewEngine: Large array (${array.length} items) detected. Using iterative rendering.`);
                }
                
                const limitedArray = array.slice(0, MAX_ARRAY_SIZE);
                
                // For large arrays, use chunk processing to prevent blocking
                if (limitedArray.length > 100) {
                    const chunks = [];
                    const chunkSize = 50;
                    
                    for (let i = 0; i < limitedArray.length; i += chunkSize) {
                        const chunk = limitedArray.slice(i, i + chunkSize);
                        const chunkResult = chunk.map(item => {
                            // Simple variable replacement for performance with HTML escaping
                            return this.replaceVariables(content, item, true);
                        }).join('');
                        chunks.push(chunkResult);
                    }
                    
                    return chunks.join('');
                } else {
                    // Use recursive rendering for smaller arrays
                    return limitedArray.map(item => {
                        // For nested data, we need to handle nested object access
                        let itemContent = content;
                        
                        // First pass: handle nested each loops within this item
                        itemContent = itemContent.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (nestedMatch, nestedArrayKey, nestedContent) => {
                            const nestedArray = item[nestedArrayKey] || [];
                            return nestedArray.map(nestedItem => {
                                return this.replaceVariables(nestedContent, nestedItem, true);
                            }).join('');
                        });
                        
                        // Second pass: replace remaining variables from the item with HTML escaping
                        return this.replaceVariables(itemContent, item, true);
                    }).join('');
                }
            });
            
            // Break if no changes were made to prevent infinite loop
            if (beforeRender === rendered) {
                break;
            }
            
            iterations++;
        }
        
        if (iterations >= MAX_ITERATIONS) {
            console.warn('ViewEngine: Maximum iterations reached in iterative rendering. Template may be incomplete.');
        }
        
        // Handle remaining block helpers and variables
        rendered = this.processFinalTemplateSteps(rendered, data);
        
        return rendered;
    }

    /**
     * Process final template steps (if, unless, variables) without recursion
     */
    processFinalTemplateSteps(template, data) {
        let rendered = template;
        
        // Handle {{#if condition}} blocks with proper nesting support
        rendered = this.processBlockHelper(rendered, 'if', (condition, content, data) => {
            const value = this.getNestedValue(data, condition);
            return value ? content : '';
        }, data);

        // Handle {{#unless condition}} blocks with proper nesting support
        rendered = this.processBlockHelper(rendered, 'unless', (condition, content, data) => {
            const value = this.getNestedValue(data, condition);
            return (!value || (Array.isArray(value) && value.length === 0)) ? content : '';
        }, data);

        // Handle {{> partial}} includes (simplified)
        rendered = rendered.replace(/\{\{> ([\w-]+).*?\}\}/g, (match, partialName) => {
            return `<!-- Partial: ${partialName} -->`;
        });

        // Replace {{variable}} with data values (HTML escaped for security)
        rendered = this.replaceVariables(rendered, data, true);

        return rendered;
    }

    /**
     * Get rendering performance metrics
     */
    getMetrics() {
        return { ...this.renderMetrics };
    }

    /**
     * Reset performance metrics
     */
    resetMetrics() {
        this.renderMetrics = {
            totalRenders: 0,
            maxDepth: 0,
            avgRenderTime: 0
        };
    }

    /**
     * Smart render method that chooses between recursive and iterative approaches
     * based on template complexity and data size
     */
    smartRender(template, data = {}) {
        // Analyze template complexity
        const eachBlocks = (template.match(/\{\{#each/g) || []).length;
        const nestedBlocks = (template.match(/\{\{#each[\s\S]*?\{\{#each/g) || []).length;
        const totalArrayItems = Object.values(data).reduce((total, value) => {
            return total + (Array.isArray(value) ? value.length : 0);
        }, 0);
        
        // Use iterative approach for complex templates or large datasets
        if (nestedBlocks > 0 || totalArrayItems > 500 || eachBlocks > 5) {
            console.log('ViewEngine: Using iterative rendering for complex template');
            return this.renderIterative(template, data);
        } else {
            // Use recursive approach for simple templates
            return this.safeRender(template, data, 0);
        }
    }

    /**
     * Render template without HTML escaping (UNSAFE - use only with trusted data)
     * This method is provided for backwards compatibility and specific use cases
     * where HTML content is intentionally being inserted
     */
    renderUnsafe(template, data = {}, depth = 0) {
        // Store original method
        const originalReplaceVariables = this.replaceVariables;
        
        // Temporarily override to disable escaping
        this.replaceVariables = (template, data) => {
            return originalReplaceVariables.call(this, template, data, false);
        };
        
        try {
            const result = this.render(template, data, depth);
            return result;
        } finally {
            // Restore original method
            this.replaceVariables = originalReplaceVariables;
        }
    }

    /**
     * Check if a string contains potentially dangerous HTML content
     */
    containsDangerousHTML(str) {
        if (typeof str !== 'string') return false;
        
        const dangerousPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
            /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
            /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /data:text\/html/gi
        ];
        
        return dangerousPatterns.some(pattern => pattern.test(str));
    }

    /**
     * Render view with data
     */
    async renderView(viewPath, data = {}) {
        const template = await this.loadTemplate(viewPath);
        return this.smartRender(template, data);
    }
}

// Export for browser and Node.js
if (typeof window !== 'undefined') {
    window.ViewEngine = ViewEngine;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = ViewEngine;
}
