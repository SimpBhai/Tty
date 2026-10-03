import React, { useState } from 'react';
import {
  X,
  Github,
  Cloud,
  Download,
  Upload,
  Check,
  Copy,
  Terminal,
  ExternalLink,
  Server,
  FileCode,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useSocket } from '../../context/SocketContext';

interface GitHubSyncModalProps {
  onClose: () => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({ onClose }) => {
  const { serverData, exportBackup, importBackup, updateServerSettings } = useSocket();

  const [activeTab, setActiveTab] = useState<'sync' | 'cicd' | 'render'>('sync');
  const [repoOwner, setRepoOwner] = useState(serverData?.githubSync?.repoOwner || '');
  const [repoName, setRepoName] = useState(serverData?.githubSync?.repoName || '');
  const [branch, setBranch] = useState(serverData?.githubSync?.branch || 'main');
  const [filePath, setFilePath] = useState(
    serverData?.githubSync?.filePath || 'data/aegiscord-db.json'
  );
  const [githubToken, setGithubToken] = useState('');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateServerSettings({
      githubSync: {
        repoOwner,
        repoName,
        branch,
        filePath,
        lastSyncedAt: Date.now(),
      },
    });
    setSyncStatus('Configuration saved successfully!');
    setTimeout(() => setSyncStatus(null), 3000);
  };

  // Push directly to GitHub Contents API
  const handlePushToGitHub = async () => {
    if (!repoOwner || !repoName || !githubToken) {
      setSyncStatus('Please provide repository owner, name, and GitHub Personal Access Token.');
      return;
    }

    setSyncLoading(true);
    try {
      // 1. Get current server state
      const stateRes = await fetch('/api/state');
      const stateJson = await stateRes.json();
      const contentBase64 = window.btoa(
        unescape(encodeURIComponent(JSON.stringify(stateJson.state, null, 2)))
      );

      // 2. Check if file already exists to get SHA
      let sha: string | undefined;
      const getFileRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        sha = fileData.sha;
      }

      // 3. Put / commit file to GitHub
      const putRes = await fetch(
        `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${filePath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${githubToken}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `feat(storage): automated AegisCord secure snapshot [${new Date().toISOString()}]`,
            content: contentBase64,
            branch,
            sha,
          }),
        }
      );

      if (putRes.ok) {
        setSyncStatus('✅ Successfully pushed encrypted snapshot to GitHub repository!');
      } else {
        const err = await putRes.json();
        setSyncStatus(`❌ GitHub API Error: ${err.message}`);
      }
    } catch (err: any) {
      setSyncStatus(`❌ Sync failed: ${err.message}`);
    } finally {
      setSyncLoading(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await importBackup(json);
        setSyncStatus('✅ Database snapshot restored successfully!');
      } catch {
        setSyncStatus('❌ Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const copySnippet = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const cicdWorkflowYaml = `name: AegisCord CI/CD & Storage Pipeline

on:
  push:
    branches: [ "main" ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4

      - name: Setup Node.js Runtime
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Verify Types & Build
        run: npm run build

      - name: Deploy to Render Web Service
        env:
          RENDER_DEPLOY_HOOK_URL: \${{ secrets.RENDER_DEPLOY_HOOK_URL }}
        run: |
          if [ -n "$RENDER_DEPLOY_HOOK_URL" ]; then
            echo "Triggering Render webhook deploy..."
            curl -X POST "$RENDER_DEPLOY_HOOK_URL"
          else
            echo "Render deploy hook not configured, skipping trigger step."
          fi
`;

  const renderYaml = `services:
  - type: web
    name: aegiscord-e2ee-server
    runtime: node
    plan: free
    region: oregon
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
`;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        id="modal-github-storage"
        className="w-full max-w-3xl bg-[#0d1017] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 bg-[#121622] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-800/60 flex items-center justify-center text-indigo-400">
              <Github className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>GitHub Storage Vault & Render CI/CD</span>
                <span className="text-[10px] bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded font-mono">
                  CLOUD SYNC
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Synchronize database snapshots to GitHub storage and deploy seamlessly on Render.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 bg-[#090b0e] px-4">
          <button
            onClick={() => setActiveTab('sync')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>GitHub Storage Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('cicd')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'cicd'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>GitHub Actions CI/CD</span>
          </button>

          <button
            onClick={() => setActiveTab('render')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'render'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Render Hosting Config</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar text-xs">
          {syncStatus && (
            <div className="p-3 bg-[#121622] border border-indigo-700/50 rounded-xl text-slate-200 font-medium">
              {syncStatus}
            </div>
          )}

          {activeTab === 'sync' && (
            <div className="space-y-4">
              {/* GitHub Storage Sync Form */}
              <form
                onSubmit={handleSaveSettings}
                className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl space-y-4"
              >
                <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Github className="w-4 h-4 text-indigo-400" />
                  GitHub Storage Synchronization Settings
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">REPO OWNER / ORG</label>
                    <input
                      type="text"
                      placeholder="e.g. octocat"
                      value={repoOwner}
                      onChange={(e) => setRepoOwner(e.target.value)}
                      className="w-full bg-[#121622] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">REPOSITORY NAME</label>
                    <input
                      type="text"
                      placeholder="e.g. aegiscord-storage"
                      value={repoName}
                      onChange={(e) => setRepoName(e.target.value)}
                      className="w-full bg-[#121622] border border-slate-700 rounded-lg px-3 py-2 text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">BRANCH</label>
                    <input
                      type="text"
                      placeholder="main"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full bg-[#121622] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-400 font-bold">STORAGE FILE PATH</label>
                    <input
                      type="text"
                      placeholder="data/aegiscord-db.json"
                      value={filePath}
                      onChange={(e) => setFilePath(e.target.value)}
                      className="w-full bg-[#121622] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">
                    GITHUB PERSONAL ACCESS TOKEN (PAT)
                  </label>
                  <input
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (Requires repo scope)"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    className="w-full bg-[#121622] border border-slate-700 rounded-lg px-3 py-2 text-white font-mono outline-none focus:border-indigo-500"
                  />
                  <p className="text-[10px] text-slate-500">
                    Token is kept exclusively in memory on your browser and used directly with
                    GitHub API.
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold transition-colors"
                  >
                    Save Config
                  </button>

                  <button
                    type="button"
                    onClick={handlePushToGitHub}
                    disabled={syncLoading}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
                    <span>{syncLoading ? 'Pushing...' : 'Push Snapshot to GitHub'}</span>
                  </button>
                </div>
              </form>

              {/* Local File Export & Import */}
              <div className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl space-y-3">
                <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                  <Cloud className="w-4 h-4 text-emerald-400" />
                  Manual Database Backup & Restore
                </div>
                <p className="text-slate-400">
                  Download a complete JSON state backup of all channels, encrypted messages, roles,
                  and operatives, or restore from a previously saved snapshot.
                </p>

                <div className="flex flex-wrap gap-3 pt-1">
                  <button
                    onClick={exportBackup}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-2 transition-all shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Backup (JSON)</span>
                  </button>

                  <label className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-2 cursor-pointer transition-colors border border-slate-700">
                    <Upload className="w-4 h-4" />
                    <span>Restore from Snapshot</span>
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cicd' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200">
                  GitHub Actions Pipeline (<code className="text-indigo-400">.github/workflows/deploy.yml</code>)
                </div>
                <button
                  onClick={() => copySnippet(cicdWorkflowYaml, 'cicd')}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold flex items-center gap-1"
                >
                  {copiedKey === 'cicd' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'cicd' ? 'Copied' : 'Copy YAML'}</span>
                </button>
              </div>

              <pre className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto custom-scrollbar select-all">
                {cicdWorkflowYaml}
              </pre>
            </div>
          )}

          {activeTab === 'render' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-200">
                  Render Blueprint Configuration (<code className="text-indigo-400">render.yaml</code>)
                </div>
                <button
                  onClick={() => copySnippet(renderYaml, 'render')}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-bold flex items-center gap-1"
                >
                  {copiedKey === 'render' ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  <span>{copiedKey === 'render' ? 'Copied' : 'Copy YAML'}</span>
                </button>
              </div>

              <pre className="p-4 bg-[#090b0e] border border-slate-800 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto custom-scrollbar select-all">
                {renderYaml}
              </pre>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/50 rounded-xl text-slate-300 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> Ready for Render Hosting
                </div>
                <p className="text-[11px]">
                  1. Link your GitHub repo in Render.com Dashboard. <br />
                  2. Select "Web Service" or "Blueprint". <br />
                  3. Set Build Command to <code className="text-white">npm install && npm run build</code> and
                  Start Command to <code className="text-white">npm start</code>.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#121622] border-t border-slate-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-lg text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
