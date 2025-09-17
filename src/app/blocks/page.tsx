'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import ConnectionStatus from '@/components/ConnectionStatus';
import { useMiningData, useBlockDetails, useBlocksPaginated } from '@/hooks/useMiningData';
import type { Block } from '@/hooks/useMiningData';
import styles from '@/styles/blocks.module.css';

export default function LiveBlocksPage() {
  const { telemetry, recentBlocks, isConnected } = useMiningData();
  const { blocks: paginatedBlocks, loading, hasMore, loadMore } = useBlocksPaginated();
  const [selectedBlockHeight, setSelectedBlockHeight] = useState<number | null>(null);
  const { block: selectedBlock, loading: blockLoading } = useBlockDetails(selectedBlockHeight);
  const [searchHeight, setSearchHeight] = useState('');
  const [filter, setFilter] = useState<'all' | 'orphans' | 'high-fee'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [allBlocks, setAllBlocks] = useState<Block[]>([]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Combine real-time blocks with paginated blocks
  useEffect(() => {
    const combined = [...recentBlocks, ...paginatedBlocks];
    const unique = combined.filter((block, index, arr) => 
      arr.findIndex(b => b.height === block.height) === index
    );
    setAllBlocks(unique.sort((a, b) => b.height - a.height));
  }, [recentBlocks, paginatedBlocks]);

  // Auto-scroll to new blocks
  useEffect(() => {
    if (autoScroll && recentBlocks.length > 0 && listRef.current) {
      const latestBlock = recentBlocks[0];
      if (latestBlock && selectedBlockHeight !== latestBlock.height) {
        setSelectedBlockHeight(latestBlock.height);
        listRef.current.scrollTop = 0;
      }
    }
  }, [recentBlocks, autoScroll, selectedBlockHeight]);

  const handleSearch = () => {
    const height = parseInt(searchHeight);
    if (!isNaN(height)) {
      setSelectedBlockHeight(height);
      setAutoScroll(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, height: number) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setSelectedBlockHeight(height);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(label);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const filteredBlocks = allBlocks.filter(block => {
    switch (filter) {
      case 'orphans':
        return block.isOrphan;
      case 'high-fee':
        return block.totalFees > 0.01;
      default:
        return true;
    }
  });

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m ago`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s ago`;
    return `${seconds}s ago`;
  };

  const formatHash = (hash: string, length: number = 16) => {
    return `${hash.substring(0, length)}...`;
  };

  return (
    <div className="retro-bg-xp min-h-screen">
      {/* Navigation */}
      <nav className="bg-gradient-to-b from-blue-600 to-blue-800 border-b-2 border-blue-900 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/mining" 
              className="px-3 py-1 bg-white text-blue-800 hover:bg-blue-50 text-sm font-medium border border-gray-300 transition-colors"
              style={{borderRadius: '0'}}
            >
              ← Back to Dashboard
            </Link>
            <div className="text-white font-bold text-xl flex items-center">
              <img src="/simbtclogo.png" alt="SimBTC Logo" className="w-6 h-6 mr-2" />
              SimBTC - Live Blocks
            </div>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-xs text-blue-200">
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
          </div>
        </div>
      </nav>

      <div className={styles.pageContainer}>
        {/* Connection Status */}
        {!isConnected && <ConnectionStatus isConnected={isConnected} />}

        {/* Status/Telemetry Bar */}
        <div className={styles.statusBar}>
          <div className="window">
            <div className="window-body">
              <div className="status-bar">
                <p className="status-bar-field">
                  <strong>Height:</strong> {telemetry?.height || 0}
                </p>
                <p className="status-bar-field">
                  <strong>Avg Block Time:</strong> {telemetry?.avgBlockTime.toFixed(1) || 0}s
                </p>
                <p className="status-bar-field">
                  <strong>Difficulty:</strong> {telemetry?.difficulty.toExponential(1) || 'N/A'}
                </p>
                <p className="status-bar-field">
                  <strong>Next Halving:</strong> {telemetry && telemetry.nextHalvingHeight !== null ? (telemetry.nextHalvingHeight - telemetry.height) : '—'} blocks
                </p>
                {telemetry?.emissions && (
                  <>
                    <p className="status-bar-field">
                      <strong>Current Reward:</strong> {telemetry.currentReward.toFixed(3)} BTC
                    </p>
                    <p className="status-bar-field">
                      <strong>Blocks Remaining:</strong> {telemetry.emissions.blocksRemaining}
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className={`window ${styles.toolbar}`}>
          <div className="title-bar">
              <div className="title-bar-text">Block Explorer</div>
          </div>
          <div className="window-body">
            <div className={styles.toolbarContent}>
              {/* Search */}
              <div className={styles.searchGroup}>
                <label htmlFor="search-height" className="text-sm font-medium">
                  Height:
                </label>
                <input
                  id="search-height"
                  type="number"
                  value={searchHeight}
                  onChange={(e) => setSearchHeight(e.target.value)}
                  placeholder="Block height"
                  className={styles.searchInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch}>Find</button>
              </div>

              {/* Filters */}
              <div className={styles.filterGroup}>
                <span className="text-sm font-medium">Filter:</span>
                <button
                  onClick={() => setFilter('all')}
                  className={filter === 'all' ? 'bg-blue-100' : ''}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('orphans')}
                  className={filter === 'orphans' ? 'bg-blue-100' : ''}
                >
                  Orphans
                </button>
                <button
                  onClick={() => setFilter('high-fee')}
                  className={filter === 'high-fee' ? 'bg-blue-100' : ''}
                >
                  High Fee
                </button>
              </div>

              {/* Auto-scroll toggle */}
              <div className={styles.autoScrollGroup}>
                <input
                  type="checkbox"
                  id="auto-scroll"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                />
                <label htmlFor="auto-scroll" className="text-sm">Live updates</label>
              </div>

              {/* Current height */}
              <div className={styles.currentHeight}>
                <strong>Network Height:</strong> {telemetry?.height || 0}
              </div>
            </div>
            {telemetry?.emissions && (
              <div className={styles.epochBanner}>
                Epoch {telemetry.emissions.epochIndex + 1}/{telemetry.emissions.halvingEpochs} · Reward {telemetry.currentReward.toFixed(3)} BTC · Next halving in {telemetry.nextHalvingHeight !== null ? (telemetry.nextHalvingHeight - telemetry.height) : '—'} blocks
              </div>
            )}
          </div>
        </div>

        {/* Main Two-Column Layout */}
        <div className={styles.twoColumnLayout}>
          {/* Left Column - Block List */}
          <div className={styles.blockListColumn}>
            <div className={`window ${styles.blockListWindow}`}>
              <div className="title-bar">
                <div className={`title-bar-text ${styles.blockListHeader}`}>
                  Blocks ({filteredBlocks.length})
                  {filter !== 'all' && ` - ${filter}`}
                </div>
              </div>
              <div className={`window-body ${styles.blockListBody}`}>
                <div className={styles.blockListScroll} ref={listRef}>
                  {filteredBlocks.length > 0 ? (
                    <>
                      {filteredBlocks.map((block, index) => (
                        <div
                          key={block.height}
                          className={`${styles.blockItem} ${
                            selectedBlockHeight === block.height ? styles.selected : ''
                          } ${index === 0 && recentBlocks[0]?.height === block.height ? styles.newBlock : ''}`}
                          onClick={() => setSelectedBlockHeight(block.height)}
                          onKeyPress={(e) => handleKeyPress(e, block.height)}
                          tabIndex={0}
                          role="button"
                          aria-label={`Block ${block.height}`}
                        >
                          <div className={styles.blockItemHeader}>
                            <div className="flex items-center gap-3">
                              <div className={styles.blockHeight}>
                                #{block.height}
                              </div>
                              <div className={styles.blockTime}>
                                {formatTime(block.timestamp)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                            <div className={styles.blockReward}>
                              {block.reward?.toFixed(4) || 0} BTC
                            </div>
                              <span className={`${styles.blockStatus} ${block.isOrphan ? styles.orphan : styles.valid}`}>
                                {block.isOrphan ? 'ORPHAN' : 'VALID'}
                              </span>
                            </div>
                          </div>
                          <div className={styles.blockMeta}>
                            Subsidy: {(block as any).subsidy?.toFixed(6) || (block.reward - block.totalFees).toFixed(6)} BTC | 
                            Fees: {block.totalFees?.toFixed(6) || 0} BTC | 
                            Difficulty: {block.difficulty?.toExponential(1) || 'N/A'} | 
                            Txs: {block.txCount || 0}
                          </div>
                        </div>
                      ))}
                      
                      {hasMore && (
                        <div className={styles.loadMoreContainer}>
                          <button
                            onClick={() => loadMore(allBlocks.length)}
                            disabled={loading}
                          >
                            {loading ? 'Loading...' : 'Load More Blocks'}
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className={styles.emptyState}>
                      <div>
                        <div className={styles.emptyStateIcon}>?</div>
                        <p>No blocks found</p>
                        <p className="text-xs mt-2">Try adjusting your filter</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Block Details */}
          <div className={styles.blockDetailsColumn}>
            <div className={`window ${styles.blockDetailsWindow}`}>
              <div className="title-bar">
                <div className={`title-bar-text ${styles.blockDetailsHeader}`}>
                  Block Details
                  {selectedBlockHeight !== null && ` #${selectedBlockHeight}`}
                </div>
              </div>
              <div className={`window-body ${styles.blockDetailsBody}`}>
                {selectedBlock ? (
                  <div>
                    {/* Block Information */}
                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionHeader}>Block Information</h4>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Height:</span>
                        <span className={styles.detailValue}>{selectedBlock.height}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Timestamp:</span>
                        <span className={styles.detailValue}>
                          {new Date(selectedBlock.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Status:</span>
                        <span className={`${styles.blockStatus} ${selectedBlock.isOrphan ? styles.orphan : styles.valid}`}>
                          {selectedBlock.isOrphan ? 'ORPHAN' : 'VALID'}
                        </span>
                      </div>
                    </div>

                    {/* Hashes */}
                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionHeader}>Hashes</h4>
                      <div className={styles.hashContainer}>
                        <div className={styles.hashLabel}>Block Hash:</div>
                        <div className={styles.hashValue}>{selectedBlock.hash}</div>
                        <button
                          className={styles.copyButton}
                          onClick={() => copyToClipboard(selectedBlock.hash, 'block-hash')}
                          title="Copy block hash"
                        >
                          {copiedHash === 'block-hash' ? '✓' : '📋'}
                        </button>
                      </div>
                      <div className={styles.hashContainer}>
                        <div className={styles.hashLabel}>Previous Hash:</div>
                        <div className={styles.hashValue}>{selectedBlock.previousHash}</div>
                        <button
                          className={styles.copyButton}
                          onClick={() => copyToClipboard(selectedBlock.previousHash, 'prev-hash')}
                          title="Copy previous hash"
                        >
                          {copiedHash === 'prev-hash' ? '✓' : '📋'}
                        </button>
                      </div>
                    </div>

                    {/* Mining Details */}
                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionHeader}>Mining Details</h4>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Difficulty:</span>
                        <span className={styles.detailValue}>{selectedBlock.difficulty.toExponential(2)}</span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Work Target:</span>
                        <span className={styles.detailValue}>{formatHash(selectedBlock.workTarget, 12)}</span>
                      </div>
                    </div>

                    {/* Reward Breakdown */}
                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionHeader}>Reward Breakdown</h4>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Block Subsidy:</span>
                        <span className={`${styles.detailValue} ${styles.green}`}>
                          {(selectedBlock.subsidy ?? (selectedBlock.reward - selectedBlock.totalFees)).toFixed(4)} BTC
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Total Fees:</span>
                        <span className={`${styles.detailValue} ${styles.blue}`}>
                          {selectedBlock.totalFees.toFixed(6)} BTC
                        </span>
                      </div>
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}><strong>Total Reward:</strong></span>
                        <span className={`${styles.detailValue} ${styles.green}`}>
                          <strong>{selectedBlock.reward.toFixed(4)} BTC</strong>
                        </span>
                      </div>
                    </div>

                    {/* Transactions */}
                    <div className={styles.detailSection}>
                      <h4 className={styles.sectionHeader}>
                        Transactions ({selectedBlock.txCount})
                      </h4>
                      <div className={styles.transactionsList}>
                        {selectedBlock.transactions.slice(0, 20).map((tx, index) => (
                          <div key={tx.id} className={styles.transactionItem}>
                            <div className={styles.transactionHash}>
                              {formatHash(tx.id, 20)}
                            </div>
                            <div className={styles.transactionDetails}>
                              <span className={styles.transactionAmount}>
                                {tx.amount.toFixed(4)} BTC
                              </span>
                              <span className={styles.transactionFee}>
                                Fee: {tx.fee.toFixed(6)}
                              </span>
                            </div>
                          </div>
                        ))}
                        {selectedBlock.transactions.length > 20 && (
                          <div className="text-center p-2 text-xs text-gray-500">
                            ... and {selectedBlock.transactions.length - 20} more transactions
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : blockLoading ? (
                  <div className={styles.emptyState}>
                    <div>
                      <div className={styles.emptyStateIcon}>...</div>
                      <p>Loading block details...</p>
                    </div>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <div>
                      <div className={styles.emptyStateIcon}>#</div>
                      <p>Select a block to view details</p>
                      <p className="text-xs mt-2">Click on any block in the list</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Copy Toast */}
        {copiedHash && (
          <div className="fixed bottom-4 right-4 window" style={{ width: 'auto' }}>
            <div className="window-body">
              <div className="flex items-center gap-2 text-sm">
                <span>✓</span>
                <span>Hash copied to clipboard!</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}