    (function applyFlyoutPatch() {
      var poll = setInterval(function () {
        if (workspace != null && workspace.getToolbox && workspace.getToolbox() && workspace.getToolbox().getFlyout()) {
          clearInterval(poll);

          const flyout = workspace.getToolbox().getFlyout();
          const origPosition = flyout.position.bind(flyout);

          flyout.position = function () {
            this.CORNER_RADIUS = 16;

            const targetWorkspace = this.targetWorkspace;
            const mm = targetWorkspace.getMetricsManager();
            const origGetViewMetrics = mm.getViewMetrics.bind(mm);

            const toolboxElement = document.querySelector('.blocklyToolboxDiv, .blocklyToolbox');
            const bd = document.getElementById('blocklyDiv');

            // Force metrics height so Blockly properly clips overflowing blocks
            mm.getViewMetrics = function (opt_getWorkspaceCoordinates) {
              const metrics = origGetViewMetrics(opt_getWorkspaceCoordinates);
              if (toolboxElement) {
                const tbRect = toolboxElement.getBoundingClientRect();
                metrics.height = tbRect.height;
                metrics.viewHeight = tbRect.height;
              }
              return metrics;
            };

            // Perfectly align the top of the flyout to the top of the toolbox
            const origGetY = this.getY.bind(this);
            this.getY = function () {
              if (toolboxElement && bd) {
                return toolboxElement.getBoundingClientRect().top - bd.getBoundingClientRect().top;
              }
              return 20;
            };

            const origGetX = this.getX.bind(this);
            this.getX = function () {
              if (toolboxElement && bd) {
                return toolboxElement.getBoundingClientRect().right - bd.getBoundingClientRect().left + 2;
              }
              return 215;
            };

            origPosition();

            mm.getViewMetrics = origGetViewMetrics;
            this.getY = origGetY;
            this.getX = origGetX;
          };

          flyout.position();

          window.addEventListener('resize', () => {
            flyout.position();
          });

          if (flyout.show) {
            const origShow = flyout.show.bind(flyout);
            flyout.show = function (xml) {
              origShow(xml);

              // GUARANTEED HOOK: attach the background size lock AFTER flyout.show creates the SVG
              const bg = flyout.svgGroup_ ? flyout.svgGroup_.querySelector('.blocklyFlyoutBackground') : null;
              if (bg && !bg.__heightLocked) {
                bg.__heightLocked = true;
                const origSetAttr = bg.setAttribute.bind(bg);

                const enforceHeight = () => {
                  try {
                    let tb = null;
                    if (flyout.targetWorkspace && flyout.targetWorkspace.getToolbox) {
                      const toolbox = flyout.targetWorkspace.getToolbox();
                      if (toolbox) {
                        tb = toolbox.HtmlDiv || (toolbox.getHtmlDiv && toolbox.getHtmlDiv());
                      }
                    }
                    if (!tb) tb = document.querySelector('.blocklyToolboxDiv, .blocklyToolbox');

                    if (tb) {
                      const fw = flyout.getWidth ? flyout.getWidth() : (flyout.width_ || 280);

                      let tbContents = tb.querySelector('.blocklyToolboxContents');
                      let targetElem = (tbContents && tbContents.getBoundingClientRect().height > 50) ? tbContents : tb;

                      let fh = Math.max(100, targetElem.getBoundingClientRect().height);

                      const r = 16;
                      origSetAttr('d', `M 0,0 L ${fw - r},0 a ${r},${r} 0 0,1 ${r},${r} L ${fw}, ${fh - r} a ${r},${r} 0 0,1 -${r},${r} L 0,${fh} z`);

                      // CRITICAL FIX FOR OVERFLOWING BLOCKS:
                      // We must also update the clip path so blocks outside the new height are hidden!
                      if (flyout.svgGroup_) {
                        const workspaceGroup = flyout.svgGroup_.querySelector('.blocklyWorkspace');
                        if (workspaceGroup) {
                          const clipUrl = workspaceGroup.getAttribute('clip-path');
                          if (clipUrl) {
                            const clipId = clipUrl.replace(/url\(['"]?#?|['"]?\)/g, '');
                            const clipPathElem = document.getElementById(clipId);
                            if (clipPathElem) {
                              const rect = clipPathElem.querySelector('rect');
                              if (rect) {
                                rect.setAttribute('height', fh);
                              }
                            }
                          }
                        }
                      }

                      // Also update Blockly's internal height so scrollbars know the new limit
                      flyout.height_ = fh;
                    }
                  } catch (e) {
                    console.error('enforceHeight error:', e);
                  }
                };

                bg.setAttribute = function (attr, val) {
                  if (attr === 'd') {
                    if (bg.__isUpdating) return;
                    bg.__isUpdating = true;
                    enforceHeight();
                    bg.__isUpdating = false;
                    return;
                  }
                  origSetAttr(attr, val);
                };

                if (!bg.__resizeObserver) {
                  bg.__resizeObserver = new ResizeObserver(() => {
                    enforceHeight();
                  });
                  const widgetDiv = document.querySelector('.blocklyWidgetDiv') || document.body;
                  bg.__resizeObserver.observe(widgetDiv);
                }

                enforceHeight();
              }

              setTimeout(() => { flyout.position(); }, 10);
            };
          }
        }
      }, 100);
    })();