import { spawn } from 'child_process'
import chalk from 'chalk'

export interface ClaudeMergeOptions {
  originalCode: string
  generatedJSX: string
  filePath: string
  componentImports?: Array<{ component: string; importPath: string }>
  stateContext?: Record<string, any>  // Mock values used during snapshot rendering
  // For internal component updates (only update a specific component in the file)
  internalComponentName?: string
  internalComponentRange?: {
    startLine: number
    endLine: number
  }
}

/**
 * Use Claude CLI to intelligently merge generated JSX into existing file
 * Preserves: logic, expressions, styling approach, imports, hooks
 */
export async function mergeWithClaude(options: ClaudeMergeOptions): Promise<string> {
  const { 
    originalCode, 
    generatedJSX, 
    filePath, 
    componentImports, 
    stateContext,
    internalComponentName,
    internalComponentRange 
  } = options

  let importsSection = ''
  if (componentImports && componentImports.length > 0) {
    importsSection = `\n\nCOMPONENT IMPORTS NEEDED:
The new JSX uses these components. Add imports for any that are missing:
${componentImports.map(({ component, importPath }) => `- ${component} from '${importPath}'`).join('\n')}
`
  }

  let stateContextSection = ''
  if (stateContext && Object.keys(stateContext).length > 0) {
    const stateLines = Object.entries(stateContext)
      .map(([key, value]) => `  ${key} = ${JSON.stringify(value)}`)
      .join('\n')
    stateContextSection = `\n\nIMPORTANT - SNAPSHOT RENDERING CONTEXT:
The JSX below is a RENDERED SNAPSHOT with these mock values:
${stateLines}

This means:
- Any dynamic expressions ({variables}, loops, conditionals) were evaluated with the above values
- The JSX shows what the component looked like when rendered with this specific state
- DO NOT treat this as literal code to copy - treat it as a visual reference of what changed
`
  }

  // If updating an internal component, use a specialized prompt
  if (internalComponentName && internalComponentRange) {
    const prompt = `You are a code transformation tool. Output ONLY valid TypeScript code, nothing else.

TASK: Update ONLY the internal component "${internalComponentName}" (lines ${internalComponentRange.startLine}-${internalComponentRange.endLine}) in this file.

ORIGINAL FILE:
\`\`\`tsx
${originalCode}
\`\`\`

EDITED SNAPSHOT (what the "${internalComponentName}" component should now render):
\`\`\`jsx
${generatedJSX}
\`\`\`${stateContextSection}${importsSection}

CRITICAL INSTRUCTIONS:
1. ONLY modify the "${internalComponentName}" component (approximately lines ${internalComponentRange.startLine}-${internalComponentRange.endLine})
2. DO NOT modify any other components in the file
3. DO NOT modify the main/exported component(s)
4. Compare the original "${internalComponentName}" vs the snapshot to find what changed
5. Apply those changes ONLY to "${internalComponentName}"
6. Keep all props, hooks, and logic within "${internalComponentName}" intact
7. If original uses Tailwind classes, convert any inline styles to Tailwind
8. Output the COMPLETE UPDATED FILE from start to end

OUTPUT REQUIREMENTS:
- Output must be valid, parseable TypeScript/TSX code
- Start with the import statements from the original file
- Include every line of the file
- The ONLY changes should be within the "${internalComponentName}" component
- All other components in the file must remain EXACTLY as they were
- No markdown code fences
- No explanations or comments about what changed
- Do not output anything except the updated source code`

    console.log(chalk.blue(`  → Using Claude to update internal component: ${internalComponentName}...`))

    try {
      const result = await executeClaude(prompt)
      console.log(chalk.green(`  ✓ Claude merge complete for ${internalComponentName}`))
      return result
    } catch (error) {
      console.error(chalk.red(`  ✗ Claude merge failed for ${internalComponentName}:`), error)
      throw error
    }
  }

  // Normal full-file merge
  const prompt = `You are a code transformation tool. Output ONLY valid TypeScript code, nothing else.

TASK: Merge visual edits into a React component file.

ORIGINAL FILE:
\`\`\`tsx
${originalCode}
\`\`\`

EDITED SNAPSHOT (what the component should now render):
\`\`\`jsx
${generatedJSX}
\`\`\`${stateContextSection}${importsSection}

INSTRUCTIONS:
1. Compare original vs snapshot to find what changed (colors, text, styles, structure)
2. Apply those changes to the ORIGINAL FILE
3. Keep all imports, hooks, logic, expressions, loops, conditionals intact
4. If original uses Tailwind classes, convert any inline styles to Tailwind
5. Output the COMPLETE UPDATED FILE from start to end

OUTPUT REQUIREMENTS:
- Output must be valid, parseable TypeScript/TSX code
- Start with the import statements from the original file
- Include every line of the file
- No markdown code fences
- No explanations or comments about what changed
- Do not output anything except the updated source code`

  console.log(chalk.blue('  → Using Claude to merge changes...'))

  try {
    const result = await executeClaude(prompt)
    console.log(chalk.green('  ✓ Claude merge complete'))
    return result
  } catch (error) {
    console.error(chalk.red('  ✗ Claude merge failed:'), error)
    throw error
  }
}

/**
 * Execute Claude CLI command and return response
 */
function executeClaude(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use -p (print mode) to get direct text output
    // Claude should just output the code, we handle writing the file
    const claude = spawn('claude', ['-p'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: true
    })

    let stdout = ''
    let stderr = ''

    claude.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    claude.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    claude.on('error', (error) => {
      reject(new Error(`Failed to spawn claude CLI: ${error.message}`))
    })

    claude.on('close', (code) => {
      if (code === 0) {
        // Claude might wrap response in markdown code blocks
        const cleaned = cleanClaudeResponse(stdout)
        resolve(cleaned)
      } else {
        reject(new Error(`Claude CLI exited with code ${code}: ${stderr}`))
      }
    })

    // Send prompt via stdin
    claude.stdin.write(prompt)
    claude.stdin.end()
  })
}

/**
 * Clean up Claude's response - remove markdown fences if present
 * Also validates that the response looks like actual code
 */
function cleanClaudeResponse(response: string): string {
  let cleaned = response.trim()

  // Remove markdown code fences if present
  const fenceMatch = cleaned.match(/```(?:tsx?|jsx?)?\n([\s\S]*?)```/)
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim()
  }

  // Validate that the response looks like actual code
  // Check for common code patterns (imports, exports, function declarations)
  const looksLikeCode =
    cleaned.includes('import ') ||
    cleaned.includes('export ') ||
    cleaned.includes('function ') ||
    cleaned.includes('const ') ||
    cleaned.includes('return (') ||
    cleaned.startsWith("'use client'") ||
    cleaned.startsWith('"use client"')

  if (!looksLikeCode) {
    // Throw error so the caller falls back to deterministic mode
    // This is caught by the try/catch in index.ts
    throw new Error(`Claude returned non-code response. First 200 chars: ${cleaned.slice(0, 200)}`)
  }

  return cleaned
}

/**
 * Check if Claude CLI is available
 */
export async function isClaudeAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const claude = spawn('which', ['claude'], {
      stdio: 'pipe',
      shell: true
    })

    claude.on('close', (code) => {
      resolve(code === 0)
    })

    claude.on('error', () => {
      resolve(false)
    })
  })
}
