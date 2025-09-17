'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ExamplesPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [theme, setTheme] = useState('xp');

  const showTab = (index: number) => {
    setSelectedTab(index);
  };

  const changeTheme = () => {
    setTheme(prev => prev === 'xp' ? '98' : 'xp');
    // In a real implementation, you would update the CSS import here
  };

  return (
    <div className={theme === 'xp' ? 'retro-bg-xp' : 'retro-bg-98'}>
      <div className="min-h-screen p-5">
        {/* Navigation */}
        <div className="mb-5">
          <Link href="/" className="text-blue-600 underline mr-4">← Back to Loading</Link>
          <Link href="/desktop" className="text-blue-600 underline">Go to Desktop →</Link>
        </div>

        {/* Theme Selector */}
        <div className="fixed top-5 right-5 z-50">
          <div className="window" style={{ width: '200px' }}>
            <div className="title-bar">
              <div className="title-bar-text">Theme Selector</div>
            </div>
            <div className="window-body">
              <fieldset>
                <legend>Choose Theme</legend>
                <div className="field-row">
                  <input 
                    type="radio" 
                    id="xp-theme" 
                    name="theme" 
                    value="xp" 
                    checked={theme === 'xp'}
                    onChange={changeTheme}
                  />
                  <label htmlFor="xp-theme">Windows XP</label>
                </div>
                <div className="field-row">
                  <input 
                    type="radio" 
                    id="win98-theme" 
                    name="theme" 
                    value="98" 
                    checked={theme === '98'}
                    onChange={changeTheme}
                  />
                  <label htmlFor="win98-theme">Windows 98</label>
                </div>
              </fieldset>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 items-start">
          {/* Basic Window Demo */}
          <div className="window" style={{ width: '300px' }}>
            <div className="title-bar">
              <div className="title-bar-text">Welcome Program</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body">
              <h3>🎉 Welcome to the past!</h3>
              <p>Experience the nostalgia of classic Windows interfaces with XP.css.</p>
              <section className="field-row">
                <button>Get Started</button>
                <button>Learn More</button>
              </section>
            </div>
          </div>

          {/* Form Controls Demo */}
          <div className="window" style={{ width: '280px' }}>
            <div className="title-bar">
              <div className="title-bar-text">Form Controls</div>
              <div className="title-bar-controls">
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body">
              <fieldset>
                <legend>User Information</legend>
                <div className="field-row">
                  <label htmlFor="username">Username:</label>
                  <input id="username" type="text" defaultValue="user123" />
                </div>
                <div className="field-row">
                  <label htmlFor="password">Password:</label>
                  <input id="password" type="password" defaultValue="password" />
                </div>
                <div className="field-row">
                  <input id="remember" type="checkbox" defaultChecked />
                  <label htmlFor="remember">Remember me</label>
                </div>
              </fieldset>
              
              <fieldset>
                <legend>Preferences</legend>
                <div className="field-row">
                  <input id="opt1" type="radio" name="option" defaultChecked />
                  <label htmlFor="opt1">Option 1</label>
                </div>
                <div className="field-row">
                  <input id="opt2" type="radio" name="option" />
                  <label htmlFor="opt2">Option 2</label>
                </div>
                <div className="field-row">
                  <label htmlFor="country">Country:</label>
                  <select id="country">
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>Germany</option>
                    <option>Japan</option>
                  </select>
                </div>
              </fieldset>
              
              <section className="field-row" style={{ justifyContent: 'flex-end' }}>
                <button>OK</button>
                <button>Cancel</button>
              </section>
            </div>
          </div>

          {/* Progress and Sliders Demo */}
          <div className="window" style={{ width: '320px' }}>
            <div className="title-bar">
              <div className="title-bar-text">System Monitor</div>
              <div className="title-bar-controls">
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body">
              <fieldset>
                <legend>Resource Usage</legend>
                <div className="field-row">
                  <label>CPU Usage:</label>
                  <progress max="100" value="45"></progress>
                  <span>45%</span>
                </div>
                <div className="field-row">
                  <label>Memory:</label>
                  <progress max="100" value="68"></progress>
                  <span>68%</span>
                </div>
                <div className="field-row">
                  <label>Disk:</label>
                  <progress max="100" value="23"></progress>
                  <span>23%</span>
                </div>
              </fieldset>
              
              <fieldset>
                <legend>Volume Control</legend>
                <div className="field-row">
                  <label>Master:</label>
                  <input type="range" min="0" max="100" defaultValue="75" style={{ flex: 1 }} />
                  <span>75</span>
                </div>
                <div className="field-row">
                  <label>Effects:</label>
                  <input type="range" min="0" max="100" defaultValue="50" style={{ flex: 1 }} />
                  <span>50</span>
                </div>
                <div className="field-row">
                  <input type="checkbox" id="mute-all" />
                  <label htmlFor="mute-all">Mute All</label>
                </div>
              </fieldset>
            </div>
          </div>

          {/* Tabbed Interface Demo */}
          <div className="window" style={{ width: '350px' }}>
            <div className="title-bar">
              <div className="title-bar-text">System Properties</div>
              <div className="title-bar-controls">
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body">
              <div className="tabs">
                <menu role="tablist" aria-label="System Properties">
                  <button role="tab" aria-selected={selectedTab === 0} onClick={() => showTab(0)}>General</button>
                  <button role="tab" aria-selected={selectedTab === 1} onClick={() => showTab(1)}>Hardware</button>
                  <button role="tab" aria-selected={selectedTab === 2} onClick={() => showTab(2)}>Advanced</button>
                </menu>
                
                {selectedTab === 0 && (
                  <article role="tabpanel">
                    <h4>System Information</h4>
                    <p><strong>Operating System:</strong> Windows XP Professional</p>
                    <p><strong>Processor:</strong> Intel Pentium 4 2.4 GHz</p>
                    <p><strong>Memory:</strong> 512 MB RAM</p>
                    <p><strong>Computer Name:</strong> DESKTOP-XP2001</p>
                    <div className="separator"></div>
                    <p>🖥️ This computer is running a faithful recreation of the Windows XP interface using XP.css!</p>
                  </article>
                )}
                
                {selectedTab === 1 && (
                  <article role="tabpanel">
                    <h4>Hardware Configuration</h4>
                    <ul className="tree-view">
                      <li>🖥️ Computer</li>
                      <li>💽 Disk drives
                        <ul>
                          <li>💿 3½ Floppy (A:)</li>
                          <li>💿 Local Disk (C:)</li>
                          <li>💿 CD-ROM (D:)</li>
                        </ul>
                      </li>
                      <li>📺 Display adapters
                        <ul>
                          <li>🎮 VGA Compatible</li>
                        </ul>
                      </li>
                      <li>🎵 Sound devices
                        <ul>
                          <li>🔊 Sound Blaster</li>
                        </ul>
                      </li>
                    </ul>
                  </article>
                )}
                
                {selectedTab === 2 && (
                  <article role="tabpanel">
                    <h4>Advanced Settings</h4>
                    <fieldset>
                      <legend>Performance</legend>
                      <div className="field-row">
                        <input type="radio" id="perf-best" name="performance" defaultChecked />
                        <label htmlFor="perf-best">Best performance</label>
                      </div>
                      <div className="field-row">
                        <input type="radio" id="perf-balance" name="performance" />
                        <label htmlFor="perf-balance">Balance</label>
                      </div>
                      <div className="field-row">
                        <input type="radio" id="perf-appearance" name="performance" />
                        <label htmlFor="perf-appearance">Best appearance</label>
                      </div>
                    </fieldset>
                    
                    <fieldset>
                      <legend>Virtual Memory</legend>
                      <p>Total paging file size: 768 MB</p>
                      <button>Change...</button>
                    </fieldset>
                  </article>
                )}
              </div>
              
              <section className="field-row" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
                <button>OK</button>
                <button>Cancel</button>
                <button>Apply</button>
              </section>
            </div>
          </div>

          {/* Menu Demo */}
          <div className="window" style={{ width: '300px' }}>
            <div className="title-bar">
              <div className="title-bar-text">Menu Example</div>
              <div className="title-bar-controls">
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body">
              <menu role="menubar">
                <li role="menuitem" tabIndex={0} aria-haspopup="true">File</li>
                <li role="menuitem" tabIndex={0} aria-haspopup="true">Edit</li>
                <li role="menuitem" tabIndex={0} aria-haspopup="true">View</li>
                <li role="menuitem" tabIndex={0} aria-haspopup="true">Tools</li>
                <li role="menuitem" tabIndex={0} aria-haspopup="true">Help</li>
              </menu>
              
              <div className="separator"></div>
              
              <p>This demonstrates the classic menu bar styling that was common in older applications.</p>
              
              <fieldset>
                <legend>Toolbar</legend>
                <div className="field-row">
                  <button>📁 New</button>
                  <button>💾 Save</button>
                  <button>📋 Copy</button>
                  <button>📄 Paste</button>
                </div>
              </fieldset>
            </div>
          </div>

          {/* Status Bar Demo */}
          <div className="window" style={{ width: '400px' }}>
            <div className="title-bar">
              <div className="title-bar-text">Document Editor</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close"></button>
              </div>
            </div>
            <div className="window-body">
              <menu role="menubar">
                <li role="menuitem" tabIndex={0}>File</li>
                <li role="menuitem" tabIndex={0}>Edit</li>
                <li role="menuitem" tabIndex={0}>Format</li>
              </menu>
              
              <textarea 
                style={{ width: '100%', height: '120px', resize: 'none' }} 
                placeholder="Type your document here..."
              />
              
              <div className="status-bar" style={{ marginTop: '8px' }}>
                <p className="status-bar-field">Ready</p>
                <p className="status-bar-field">Line 1, Column 1</p>
                <p className="status-bar-field">100%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
