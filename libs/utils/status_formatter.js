class StatusFormatter {
    constructor({report, allPreviousCounts}) {
        this.report = report;
        this.allPreviousCounts = allPreviousCounts;
    }

    _convertToHTMLTRs({agencies, caption = "", type = "", runType="daily"}) {
        if (agencies.length > 0) {
            agencies.sort((a, b) => {
                let acronymA = a.acronym.toLowerCase(),
                    acronymB = b.acronym.toLowerCase();
                return (acronymA < acronymB) ? -1 : (acronymA > acronymB) ? 1 : 0;
            });
            let bgColor = (runType === "daily" && type.toLowerCase() === "error") ? "#F5A9A9" :
                (runType === "daily" && type.toLowerCase() === "warning") ? "#F2F5A9" :
                (runType === "daily" && type.toLowerCase() === "duplicates") ? "#A9E2F3" :
                "#FFFFFF";

            let html = "<tbody>";
            if (runType === "daily" && caption) {
                html = `<tr style="background-color: ${bgColor}; font-weight: bold">
                    <td colspan="6">${caption}</td>
                    </tr>`;
            }

            if (runType === "daily") {
                agencies.forEach(agency => {
                    let counts = [];
                    let changeText = "";
                    if (agency.added) {
                        Object.keys(agency.counts).forEach(usageType => {
                            counts.push(`${usageType}: <em>${agency.counts[usageType]}</em>`);
                        });
                        changeText = "Added";
                    } else if (agency.removed) {
                        Object.keys(agency.previousCounts).forEach(usageType => {
                            counts.push(`${usageType}: <em>${agency.previousCounts[usageType]}</em>`);
                        });
                        changeText = "Removed";
                    } else {
                        Object.keys(agency.counts).forEach(usageType => {
                            let countsText = `${usageType}: `;
                            const previousUsageTypeCount = agency.previousCounts[usageType] ? agency.previousCounts[usageType] : 0;
                            if (agency.counts[usageType] === previousUsageTypeCount) {
                                countsText += `<em>${agency.counts[usageType]}</em>`;
                            } else {
                                countsText += `<em>${agency.counts[usageType]} (${previousUsageTypeCount})</em>`;
                                changeText = "Updated";
                            }
                            counts.push(countsText);
                        });
                        //** For - Usage Type that existed previously and no longer exists  */
                        Object.keys(agency.previousCounts).filter(usageType => agency.counts[usageType] === undefined)
                        .forEach(usageType => {
                            counts.push(`${usageType}: <em>0 (${agency.previousCounts[usageType]})</em>`);
                            changeText = "Updated";
                        });
                    }
                    html += `<tr style="background-color: ${bgColor}">
                        <td>${agency.acronym}</td>
                        <td>${(agency.wasRemoteJsonRetrived ? "Yes" : "No")}</td>
                        <td>${(agency.wasRemoteJsonParsed ? "Yes" : "No")}</td>
                        <td>${(agency.wasFallbackUsed ? "Yes" : "No")}</td>
                        <td>${counts.join(" | ")}</td>
                        <td>${changeText}</td>
                        </tr>`;
                });
                html +="</tbody>"
            } else {
                let totalCounts = { total: 0, openSource: 0, governmentWideReuse: 0, exemptOther: 0 }; 
                agencies.forEach(agency => {
                    let counts = { total: 0, openSource: 0, governmentWideReuse: 0, exemptOther: 0 };
                    Object.keys(agency.counts).forEach(usageType => {
                        switch (usageType) {
                            case "processed":
                            case "duplicates":
                                break;
                            case "total":
                                counts.total = agency.counts.total;
                                totalCounts.total += agency.counts.total;
                                break;
                            case "openSource":
                                counts.openSource = agency.counts.openSource;
                                totalCounts.openSource += agency.counts.openSource;
                                break;
                            case "governmentWideReuse":
                                counts.governmentWideReuse = agency.counts.governmentWideReuse;
                                totalCounts.governmentWideReuse += agency.counts.governmentWideReuse;
                                break;
                            default:
                                counts.exemptOther += agency.counts[usageType];
                                totalCounts.exemptOther += agency.counts[usageType];
                                break;
                        }
                    });
                    html += `<tr style="background-color: ${bgColor}">
                    <td>${agency.acronym}</td>
                    <td style="text-align:right">${counts.total}</td>
                    <td style="text-align:right">${counts.openSource}</td>
                    <td style="text-align:right">${counts.governmentWideReuse}</td>
                    <td style="text-align:right">${counts.exemptOther}</td>
                    </tr>`;
                });
                html += `</tbody>
                <tfoot><tr style="background-color: #E6E6E6">
                <th style="text-align:left">Total</th>
                <th style="text-align:right">${totalCounts.total}</th>
                <th style="text-align:right">${totalCounts.openSource}</th>
                <th style="text-align:right">${totalCounts.governmentWideReuse}</th>
                <th style="text-align:right">${totalCounts.exemptOther}</th>
                </tfoot></tr>`
            }
            return html;
        }
        return "";
    }

    _getDailyHTML({timestamp, agencies}) {
        let html = `<h3>CODE.GOV Repository Harvester Execution Summary</h3>
        <h4>Time: ${timestamp}</h4>
        <table border="1" cellspacing="0" cellpadding="2">
          <thead>
          <tr style="background-color: #E6E6E6">
          <th>Agency<br />Acronym</th>
          <th>Retrieved Remote<br />code.json</th>
          <th>Parsed Remote<br />code.json</th>
          <th>Fallback<br />Used</th>
          <th>Repository Counts</th> 
          <th>Change</th>
          </tr>
          </thead>`;
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => !agency.removed && !agency.wasRemoteJsonRetrived && !agency.wasFallbackUsed),
            caption: "No remote code.json file.  Missing fallback file or errors while processing fallback file.",
            type: "error"
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => !agency.removed && agency.wasRemoteJsonRetrived && !agency.wasRemoteJsonParsed && !agency.wasFallbackUsed),
            caption: "Errors while processing remote code.json file.  Missing fallback file or errors while processing fallback file.",
            type: "error"
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => !agency.removed && !agency.wasRemoteJsonRetrived && agency.wasFallbackUsed),
            caption: "No remote code.json file.  Used fallback file successfully.",
            type: "warning"
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => !agency.removed && agency.wasRemoteJsonRetrived && !agency.wasRemoteJsonParsed && agency.wasFallbackUsed),
            caption: "Errors while processing Remote code.json file.  Used fallback file successfully.",
            type: "warning"
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => !agency.removed && agency.wasRemoteJsonRetrived && agency.wasRemoteJsonParsed && agency.counts.duplicates),
            caption: "Used remote code.json successfully - with duplicates.",
            type: "duplicates"
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => !agency.removed && agency.wasRemoteJsonRetrived && agency.wasRemoteJsonParsed && !agency.counts.duplicates),
            caption: "Used remote code.json successfully."
        });
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => agency.removed),
            caption: "Agencies removed from metadata JSON file"
        });
        html += `</table>`;
        return html
    }

    _getMonthEndHTML({agencies}) {
        let html = `<hr/><h3>Summary</h3>
        <table border="1" cellspacing="0" cellpadding="2">
          <thead>
          <tr style="background-color: #E6E6E6">
          <th rowspan="2">Agency<br />Acronym</th>
          <th colspan="4">Repository Counts</th>
          </tr>
          <tr style="background-color: #E6E6E6">
          <th style="text-align:right">Total</th> 
          <th style="text-align:right">Open Source</th>
          <th style="text-align:right">Govenment Wide Re-use</th>
          <th style="text-align:right">Exempt / Other</th>
          </tr>
          </thead>`;
        html += this._convertToHTMLTRs({
            agencies: agencies.filter(agency => !agency.removed),
            runType: "monthEnd"
        });
        html += `</table>`;
        return html
      }

    getFormattedStatus(runType="daily") {
        let agencies = [];
        const {
            timestamp,
            statuses
        } = this.report;
        Object.keys(statuses).forEach(acronym => {
            const {
                wasFallbackUsed,
                wasRemoteJsonRetrived,
                wasRemoteJsonParsed,
                counts
            } = statuses[acronym];
            agencies.push({
                acronym,
                wasFallbackUsed,
                wasRemoteJsonRetrived,
                wasRemoteJsonParsed,
                counts,
                previousCounts : this.allPreviousCounts[acronym] ? this.allPreviousCounts[acronym] : {},
                added: this.allPreviousCounts[acronym] ? false : true
            });
        });
        //** For Agencies that existed and are no longer there */
        Object.keys(this.allPreviousCounts).forEach(acronym => {
            if (!agencies.find(agency => { return agency.acronym === acronym }))  {
                agencies.push({
                    acronym,
                    wasFallbackUsed: false,
                    wasRemoteJsonRetrived: false,
                    wasRemoteJsonParsed: false,
                    counts: {},
                    previousCounts: this.allPreviousCounts[acronym],
                    removed: true
                });
            }
        });
        return (runType === "daily") ? this._getDailyHTML({timestamp, agencies}) : this._getMonthEndHTML({timestamp, agencies});
    }
}

module.exports = StatusFormatter;