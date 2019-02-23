define(['showdown', 'citation'], function (showdown, citation) {

	return showdown.extension('showdown-citation', function() {

		const Cite = require('citation-js');

		var allCites = new Cite();

		// set up a custom CSL template so that we can use apa style without the url at the end.
		// for DOI's, we add this url manually so that it can have a <a> tag (not supported in CSL)
		let templateName = 'apa-no-url'

		// the docs for citation.js indicate that the CSL should go right into the doc as so.
		// TODO: figure out a better way to import this.
		let template = '﻿<?xml version="1.0" encoding="utf-8"?>'+
		'<style xmlns="http://purl.org/net/xbiblio/csl" class="in-text" version="1.0" demote-non-dropping-particle="never">'+
		'  <!-- This style was edited with the Visual CSL Editor (http://editor.citationstyles.org/visualEditor/) -->'+
		'  <info>'+
		'    <title>American Psychological Association 6th edition (no DOIs, no issue numbers)</title>'+
		'    <title-short>APA</title-short>'+
		'    <id>http://www.zotero.org/styles/american-psychological-association-6th-edition</id>'+
		'    <link href="http://www.zotero.org/styles/american-psychological-association-6th-edition" rel="self"/>'+
		'    <link href="http://owl.english.purdue.edu/owl/resource/560/01/" rel="documentation"/>'+
		'    <author>'+
		'      <name>Simon Kornblith</name>'+
		'      <email>simon@simonster.com</email>'+
		'    </author>'+
		'    <contributor>'+
		'      <name>Bruce DArcus</name>'+
		'    </contributor>'+
		'    <contributor>'+
		'      <name>Curtis M. Humphrey</name>'+
		'    </contributor>'+
		'    <contributor>'+
		'      <name>Richard Karnesky</name>'+
		'      <email>karnesky+zotero@gmail.com</email>'+
		'      <uri>http://arc.nucapt.northwestern.edu/Richard_Karnesky</uri>'+
		'    </contributor>'+
		'    <contributor>'+
		'      <name>Sebastian Karcher</name>'+
		'    </contributor>'+
		'    <contributor>'+
		'      <name> Brenton M. Wiernik</name>'+
		'      <email>zotero@wiernik.org</email>'+
		'    </contributor>'+
		'    <category citation-format="author-date"/>'+
		'    <category field="psychology"/>'+
		'    <category field="generic-base"/>'+
		'    <summary>APA 6th edition, but without DOIs and issue numbers, as used in a number of journals like Organization Studies</summary>'+
		'    <updated>2018-12-12T20:07:26+00:00</updated>'+
		'    <rights license="http://creativecommons.org/licenses/by-sa/3.0/">This work is licensed under a Creative Commons Attribution-ShareAlike 3.0 License</rights>'+
		'  </info>'+
		'  <locale xml:lang="en">'+
		'    <terms>'+
		'      <term name="editortranslator" form="short">'+
		'        <single>ed. &amp; trans.</single>'+
		'        <multiple>eds. &amp; trans.</multiple>'+
		'      </term>'+
		'      <term name="translator" form="short">trans.</term>'+
		'    </terms>'+
		'  </locale>'+
		'  <locale xml:lang="es">'+
		'    <terms>'+
		'      <term name="from">de</term>'+
		'    </terms>'+
		'  </locale>'+
		'  <macro name="container-contributors">'+
		'    <choose>'+
		'      <if type="chapter paper-conference entry-dictionary entry-encyclopedia" match="any">'+
		'        <group delimiter=", ">'+
		'          <names variable="container-author" delimiter=", ">'+
		'            <name and="symbol" initialize-with=". " delimiter=", "/>'+
		'            <label form="short" prefix=" (" text-case="title" suffix=")"/>'+
		'          </names>'+
		'          <names variable="editor translator" delimiter=", ">'+
		'            <name and="symbol" initialize-with=". " delimiter=", "/>'+
		'            <label form="short" prefix=" (" text-case="title" suffix=")"/>'+
		'          </names>'+
		'        </group>'+
		'      </if>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="secondary-contributors">'+
		'    <choose>'+
		'      <if type="article-journal chapter paper-conference entry-dictionary entry-encyclopedia" match="none">'+
		'        <group delimiter=", " prefix=" (" suffix=")">'+
		'          <names variable="container-author" delimiter=", ">'+
		'            <name and="symbol" initialize-with=". " delimiter=", "/>'+
		'            <label form="short" prefix=", " text-case="title"/>'+
		'          </names>'+
		'          <names variable="editor translator" delimiter=", ">'+
		'            <name and="symbol" initialize-with=". " delimiter=", "/>'+
		'            <label form="short" prefix=", " text-case="title"/>'+
		'          </names>'+
		'        </group>'+
		'      </if>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="author">'+
		'    <names variable="author">'+
		'      <name name-as-sort-order="all" and="symbol" sort-separator=", " initialize-with=". " delimiter=", " delimiter-precedes-last="always"/>'+
		'      <label form="short" prefix=" (" suffix=")" text-case="capitalize-first"/>'+
		'      <substitute>'+
		'        <names variable="editor"/>'+
		'        <names variable="translator"/>'+
		'        <choose>'+
		'          <if type="report">'+
		'            <text variable="publisher"/>'+
		'            <text macro="title"/>'+
		'          </if>'+
		'          <else>'+
		'            <text macro="title"/>'+
		'          </else>'+
		'        </choose>'+
		'      </substitute>'+
		'    </names>'+
		'  </macro>'+
		'  <macro name="author-short">'+
		'    <choose>'+
		'      <if type="patent" variable="number" match="all">'+
		'        <text macro="patent-number"/>'+
		'      </if>'+
		'      <else>'+
		'        <names variable="author">'+
		'          <name form="short" and="symbol" delimiter=", " initialize-with=". "/>'+
		'          <substitute>'+
		'            <names variable="editor"/>'+
		'            <names variable="translator"/>'+
		'            <choose>'+
		'              <if type="report">'+
		'                <text variable="publisher"/>'+
		'                <text variable="title" form="short" font-style="italic"/>'+
		'              </if>'+
		'              <else-if type="legal_case">'+
		'                <text variable="title" font-style="italic"/>'+
		'              </else-if>'+
		'              <else-if type="book graphic  motion_picture song" match="any">'+
		'                <text variable="title" form="short" font-style="italic"/>'+
		'              </else-if>'+
		'              <else-if type="bill legislation" match="any">'+
		'                <text variable="title" form="short"/>'+
		'              </else-if>'+
		'              <else-if variable="reviewed-author">'+
		'                <choose>'+
		'                  <if variable="reviewed-title" match="none">'+
		'                    <text variable="title" form="short" font-style="italic" prefix="Review of "/>'+
		'                  </if>'+
		'                  <else>'+
		'                    <text variable="title" form="short" quotes="true"/>'+
		'                  </else>'+
		'                </choose>'+
		'              </else-if>'+
		'              <else>'+
		'                <text variable="title" form="short" quotes="true"/>'+
		'              </else>'+
		'            </choose>'+
		'          </substitute>'+
		'        </names>'+
		'      </else>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="patent-number">'+
		'    <group delimiter=" ">'+
		'      <group delimiter=" ">'+
		'        <text variable="genre"/>'+
		'        <text term="issue" form="short" text-case="capitalize-first"/>'+
		'      </group>'+
		'      <text variable="number"/>'+
		'    </group>'+
		'  </macro>'+
		'  <macro name="access">'+
		'    <choose>'+
		'      <if type="thesis report" match="any">'+
		'        <choose>'+
		'          <if variable="archive" match="any">'+
		'            <group>'+
		'              <text term="retrieved" text-case="capitalize-first" suffix=" "/>'+
		'              <text term="from" suffix=" "/>'+
		'              <text variable="archive" suffix="."/>'+
		'              <text variable="archive_location" prefix=" (" suffix=")"/>'+
		'            </group>'+
		'          </if>'+
		'          <else>'+
		'            <group>'+
		'              <text term="retrieved" text-case="capitalize-first" suffix=" "/>'+
		'              <text term="from" suffix=" "/>'+
		'              <text variable="URL"/>'+
		'            </group>'+
		'          </else>'+
		'        </choose>'+
		'      </if>'+
		'      <else>'+
		'        <choose>'+
		'          <if variable="page" match="none">'+
		'            <choose>'+
		'              <else>'+
		'                <choose>'+
		'                  <if type="webpage">'+
		'                    <group delimiter=" ">'+
		'                      <text term="retrieved" text-case="capitalize-first" suffix=" "/>'+
		'                      <group>'+
		'                        <date variable="accessed" form="text" suffix=", "/>'+
		'                      </group>'+
		'                      <text term="from"/>'+
		'                      <text variable="URL"/>'+
		'                    </group>'+
		'                  </if>'+
		'                  <else>'+
		'                    <group>'+
		'                      <text term="retrieved" text-case="capitalize-first" suffix=" "/>'+
		'                      <text term="from" suffix=" "/>'+
		'                      <text variable="URL"/>'+
		'                    </group>'+
		'                  </else>'+
		'                </choose>'+
		'              </else>'+
		'            </choose>'+
		'          </if>'+
		'        </choose>'+
		'      </else>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="title">'+
		'    <choose>'+
		'      <if type="book dataset graphic manuscript motion_picture report song speech thesis" match="any">'+
		'        <choose>'+
		'          <if variable="version" type="book" match="all">'+
		'            <text variable="title"/>'+
		'          </if>'+
		'          <else>'+
		'            <text variable="title" font-style="italic"/>'+
		'          </else>'+
		'        </choose>'+
		'      </if>'+
		'      <else-if variable="reviewed-author">'+
		'        <choose>'+
		'          <if variable="reviewed-title">'+
		'            <group delimiter=" ">'+
		'              <text variable="title"/>'+
		'              <group delimiter=", " prefix="[" suffix="]">'+
		'                <text variable="reviewed-title" font-style="italic" prefix="Review of "/>'+
		'                <names variable="reviewed-author" delimiter=", ">'+
		'                  <label form="verb-short" suffix=" "/>'+
		'                  <name and="symbol" initialize-with=". " delimiter=", "/>'+
		'                </names>'+
		'              </group>'+
		'            </group>'+
		'          </if>'+
		'          <else>'+
		'            <group delimiter=", " prefix="[" suffix="]">'+
		'              <text variable="title" font-style="italic" prefix="Review of "/>'+
		'              <names variable="reviewed-author" delimiter=", ">'+
		'                <label form="verb-short" suffix=" "/>'+
		'                <name and="symbol" initialize-with=". " delimiter=", "/>'+
		'              </names>'+
		'            </group>'+
		'          </else>'+
		'        </choose>'+
		'      </else-if>'+
		'      <else-if type="patent" variable="number" match="all">'+
		'        <text macro="patent-number" font-style="italic"/>'+
		'      </else-if>'+
		'      <else>'+
		'        <text variable="title" />'+
		'      </else>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="title-plus-extra">'+
		'    <text macro="title"/>'+
		'    <choose>'+
		'      <if type="report thesis" match="any">'+
		'        <group prefix=" (" suffix=")" delimiter=", ">'+
		'          <group delimiter=" ">'+
		'            <choose>'+
		'              <if variable="genre" match="any">'+
		'                <text variable="genre"/>'+
		'              </if>'+
		'              <else>'+
		'                <text variable="collection-title"/>'+
		'              </else>'+
		'            </choose>'+
		'            <text variable="number" prefix="No. "/>'+
		'          </group>'+
		'          <group delimiter=" ">'+
		'            <text term="version" text-case="capitalize-first"/>'+
		'            <text variable="version"/>'+
		'          </group>'+
		'          <text macro="edition"/>'+
		'        </group>'+
		'      </if>'+
		'      <else-if type="post-weblog webpage" match="any">'+
		'        <text variable="genre" prefix=" [" suffix="]"/>'+
		'      </else-if>'+
		'      <else-if variable="version">'+
		'        <group delimiter=" " prefix=" (" suffix=")">'+
		'          <text term="version" text-case="capitalize-first"/>'+
		'          <text variable="version"/>'+
		'        </group>'+
		'      </else-if>'+
		'    </choose>'+
		'    <text macro="format" prefix=" [" suffix="]"/>'+
		'  </macro>'+
		'  <macro name="format">'+
		'    <choose>'+
		'      <if match="any" variable="medium">'+
		'        <text variable="medium" text-case="capitalize-first"/>'+
		'      </if>'+
		'      <else-if type="dataset" match="any">'+
		'        <choose>'+
		'          <if variable="genre">'+
		'            <text variable="genre" text-case="capitalize-first"/>'+
		'          </if>'+
		'          <else>'+
		'            <text value="Data set"/>'+
		'          </else>'+
		'        </choose>'+
		'      </else-if>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="publisher">'+
		'    <choose>'+
		'      <if type="report" match="any">'+
		'        <group delimiter=": ">'+
		'          <text variable="publisher-place"/>'+
		'          <text variable="publisher"/>'+
		'        </group>'+
		'      </if>'+
		'      <else-if type="thesis" match="any">'+
		'        <group delimiter=", ">'+
		'          <text variable="publisher"/>'+
		'          <text variable="publisher-place"/>'+
		'        </group>'+
		'      </else-if>'+
		'      <else-if type="patent">'+
		'        <group delimiter=": ">'+
		'          <text variable="publisher-place"/>'+
		'          <choose>'+
		'            <if variable="publisher">'+
		'              <text variable="publisher"/>'+
		'            </if>'+
		'            <else>'+
		'              <text variable="authority"/>'+
		'            </else>'+
		'          </choose>'+
		'        </group>'+
		'      </else-if>'+
		'      <else-if type="post-weblog webpage" match="none">'+
		'        <group delimiter=", ">'+
		'          <choose>'+
		'            <if variable="event version" type="speech dataset motion_picture" match="none">'+
		'              <text variable="genre"/>'+
		'            </if>'+
		'          </choose>'+
		'          <choose>'+
		'            <if type="article-journal article-magazine article-newspaper" match="none">'+
		'              <group delimiter=": ">'+
		'                <choose>'+
		'                  <if variable="publisher-place">'+
		'                    <text variable="publisher-place"/>'+
		'                  </if>'+
		'                  <else>'+
		'                    <text variable="event-place"/>'+
		'                  </else>'+
		'                </choose>'+
		'                <text variable="publisher"/>'+
		'              </group>'+
		'            </if>'+
		'          </choose>'+
		'        </group>'+
		'      </else-if>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="event">'+
		'    <choose>'+
		'      <if variable="container-title" match="none">'+
		'        <choose>'+
		'          <if variable="event">'+
		'            <choose>'+
		'              <if variable="genre" match="none">'+
		'                <text term="presented at" text-case="capitalize-first" suffix=" "/>'+
		'                <text variable="event"/>'+
		'              </if>'+
		'              <else>'+
		'                <group delimiter=" ">'+
		'                  <text variable="genre" text-case="capitalize-first"/>'+
		'                  <text term="presented at"/>'+
		'                  <text variable="event"/>'+
		'                </group>'+
		'              </else>'+
		'            </choose>'+
		'          </if>'+
		'          <else-if type="speech">'+
		'            <text variable="genre" text-case="capitalize-first"/>'+
		'          </else-if>'+
		'        </choose>'+
		'      </if>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="issued">'+
		'    <choose>'+
		'      <if type="bill legal_case legislation" match="any"/>'+
		'      <else-if variable="issued">'+
		'        <group>'+
		'          <date variable="issued">'+
		'            <date-part name="year"/>'+
		'          </date>'+
		'          <text variable="year-suffix"/>'+
		'          <choose>'+
		'            <if type="speech" match="any">'+
		'              <date variable="issued" delimiter=" ">'+
		'                <date-part prefix=", " name="month"/>'+
		'              </date>'+
		'            </if>'+
		'            <else-if type="article article-magazine article-newspaper broadcast interview pamphlet personal_communication post post-weblog treaty webpage" match="any">'+
		'              <date variable="issued">'+
		'                <date-part prefix=", " name="month"/>'+
		'                <date-part prefix=" " name="day"/>'+
		'              </date>'+
		'            </else-if>'+
		'          </choose>'+
		'        </group>'+
		'      </else-if>'+
		'      <else-if variable="status">'+
		'        <group>'+
		'          <text variable="status" text-case="lowercase"/>'+
		'          <text variable="year-suffix" prefix="-"/>'+
		'        </group>'+
		'      </else-if>'+
		'      <else>'+
		'        <group>'+
		'          <text term="no date" form="short"/>'+
		'          <text variable="year-suffix" prefix="-"/>'+
		'        </group>'+
		'      </else>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="issued-sort">'+
		'    <choose>'+
		'      <if type="article article-magazine article-newspaper broadcast interview pamphlet personal_communication post post-weblog speech treaty webpage" match="any">'+
		'        <date variable="issued">'+
		'          <date-part name="year"/>'+
		'          <date-part name="month"/>'+
		'          <date-part name="day"/>'+
		'        </date>'+
		'      </if>'+
		'      <else>'+
		'        <date variable="issued">'+
		'          <date-part name="year"/>'+
		'        </date>'+
		'      </else>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="issued-year">'+
		'    <choose>'+
		'      <if variable="issued">'+
		'        <group delimiter="/">'+
		'          <choose>'+
		'            <if is-uncertain-date="original-date">'+
		'              <group prefix="[" suffix="]" delimiter=" ">'+
		'                <text term="circa" form="short"/>'+
		'                <date variable="original-date">'+
		'                  <date-part name="year"/>'+
		'                </date>'+
		'              </group>'+
		'            </if>'+
		'            <else>'+
		'              <date variable="original-date">'+
		'                <date-part name="year"/>'+
		'              </date>'+
		'            </else>'+
		'          </choose>'+
		'          <choose>'+
		'            <if is-uncertain-date="issued">'+
		'              <group prefix="[" suffix="]" delimiter=" ">'+
		'                <text term="circa" form="short"/>'+
		'                <group>'+
		'                  <date variable="issued">'+
		'                    <date-part name="year"/>'+
		'                  </date>'+
		'                  <text variable="year-suffix"/>'+
		'                </group>'+
		'              </group>'+
		'            </if>'+
		'            <else>'+
		'              <group>'+
		'                <date variable="issued">'+
		'                  <date-part name="year"/>'+
		'                </date>'+
		'                <text variable="year-suffix"/>'+
		'              </group>'+
		'            </else>'+
		'          </choose>'+
		'        </group>'+
		'      </if>'+
		'      <else-if variable="status">'+
		'        <text variable="status" text-case="lowercase"/>'+
		'        <text variable="year-suffix" prefix="-"/>'+
		'      </else-if>'+
		'      <else>'+
		'        <text term="no date" form="short"/>'+
		'        <text variable="year-suffix" prefix="-"/>'+
		'      </else>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="original-date">'+
		'    <choose>'+
		'      <if type="bill legal_case legislation" match="any"/>'+
		'      <else-if type="speech" match="any">'+
		'        <date variable="original-date" delimiter=" ">'+
		'          <date-part name="month"/>'+
		'          <date-part name="year"/>'+
		'        </date>'+
		'      </else-if>'+
		'      <else-if type="article article-magazine article-newspaper broadcast interview pamphlet personal_communication post post-weblog treaty webpage" match="any">'+
		'        <date variable="original-date" form="text"/>'+
		'      </else-if>'+
		'      <else>'+
		'        <date variable="original-date">'+
		'          <date-part name="year"/>'+
		'        </date>'+
		'      </else>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="original-published">'+
		'    <choose>'+
		'      <if type="bill legal_case legislation" match="any"/>'+
		'      <else-if type="broadcast interview motion_picture song">'+
		'        <text value="Original work recorded"/>'+
		'      </else-if>'+
		'      <else-if type="broadcast">'+
		'        <text value="Original work broadcast"/>'+
		'      </else-if>'+
		'      <else>'+
		'        <text value="Original work published"/>'+
		'      </else>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="edition">'+
		'    <choose>'+
		'      <if is-numeric="edition">'+
		'        <group delimiter=" ">'+
		'          <number variable="edition" form="ordinal"/>'+
		'          <text term="edition" form="short"/>'+
		'        </group>'+
		'      </if>'+
		'      <else>'+
		'        <text variable="edition"/>'+
		'      </else>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="locators">'+
		'    <choose>'+
		'      <if type="article-journal article-magazine" match="any">'+
		'        <group prefix=", " delimiter=", ">'+
		'          <group>'+
		'            <text variable="volume" font-style="italic"/>'+
		'          </group>'+
		'          <text variable="page"/>'+
		'        </group>'+
		'        <choose>'+
		'          <if variable="issued">'+
		'            <choose>'+
		'              <if variable="page issue" match="none">'+
		'                <text variable="status" text-case="capitalize-first" prefix=". "/>'+
		'              </if>'+
		'            </choose>'+
		'          </if>'+
		'        </choose>'+
		'      </if>'+
		'      <else-if type="article-newspaper">'+
		'        <group delimiter=" " prefix=", ">'+
		'          <label variable="page" form="short"/>'+
		'          <text variable="page"/>'+
		'        </group>'+
		'      </else-if>'+
		'      <else-if type="book graphic motion_picture report song chapter paper-conference entry-encyclopedia entry-dictionary" match="any">'+
		'        <group prefix=" (" suffix=")" delimiter=", ">'+
		'          <choose>'+
		'            <if type="report" match="none">'+
		'              <text macro="edition"/>'+
		'            </if>'+
		'          </choose>'+
		'          <choose>'+
		'            <if variable="volume" match="any">'+
		'              <group>'+
		'                <text term="volume" form="short" text-case="capitalize-first" suffix=" "/>'+
		'                <number variable="volume" form="numeric"/>'+
		'              </group>'+
		'            </if>'+
		'            <else>'+
		'              <group>'+
		'                <text term="volume" form="short" plural="true" text-case="capitalize-first" suffix=" "/>'+
		'                <number variable="number-of-volumes" form="numeric" prefix="1–"/>'+
		'              </group>'+
		'            </else>'+
		'          </choose>'+
		'          <group>'+
		'            <label variable="page" form="short" suffix=" "/>'+
		'            <text variable="page"/>'+
		'          </group>'+
		'        </group>'+
		'      </else-if>'+
		'      <else-if type="legal_case">'+
		'        <group prefix=" (" suffix=")" delimiter=" ">'+
		'          <text variable="authority"/>'+
		'          <choose>'+
		'            <if variable="container-title" match="any">'+
		'              <date variable="issued" form="numeric" date-parts="year"/>'+
		'            </if>'+
		'            <else>'+
		'              <date variable="issued" form="text"/>'+
		'            </else>'+
		'          </choose>'+
		'        </group>'+
		'      </else-if>'+
		'      <else-if type="bill legislation" match="any">'+
		'        <date variable="issued" prefix=" (" suffix=")">'+
		'          <date-part name="year"/>'+
		'        </date>'+
		'      </else-if>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="citation-locator">'+
		'    <group>'+
		'      <choose>'+
		'        <if locator="chapter">'+
		'          <label variable="locator" form="long" text-case="capitalize-first"/>'+
		'        </if>'+
		'        <else>'+
		'          <label variable="locator" form="short"/>'+
		'        </else>'+
		'      </choose>'+
		'      <text variable="locator" prefix=" "/>'+
		'    </group>'+
		'  </macro>'+
		'  <macro name="container">'+
		'    <choose>'+
		'      <if type="post-weblog webpage" match="none">'+
		'        <group>'+
		'          <choose>'+
		'            <if type="chapter paper-conference entry-encyclopedia" match="any">'+
		'              <text term="in" text-case="capitalize-first" suffix=" "/>'+
		'            </if>'+
		'          </choose>'+
		'          <group delimiter=", ">'+
		'            <text macro="container-contributors"/>'+
		'            <text macro="secondary-contributors"/>'+
		'            <text macro="container-title"/>'+
		'          </group>'+
		'        </group>'+
		'      </if>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="container-title">'+
		'    <choose>'+
		'      <if type="article article-journal article-magazine article-newspaper" match="any">'+
		'        <text variable="container-title" font-style="italic" text-case="title"/>'+
		'      </if>'+
		'      <else-if type="bill legal_case legislation" match="none">'+
		'        <text variable="container-title" font-style="italic"/>'+
		'      </else-if>'+
		'    </choose>'+
		'  </macro>'+
		'  <macro name="legal-cites">'+
		'    <choose>'+
		'      <if type="legal_case" match="any">'+
		'        <group prefix=", " delimiter=" ">'+
		'          <choose>'+
		'            <if variable="container-title">'+
		'              <text variable="volume"/>'+
		'              <text variable="container-title"/>'+
		'              <group delimiter=" ">'+
		'                <text term="section" form="symbol"/>'+
		'                <text variable="section"/>'+
		'              </group>'+
		'              <text variable="page"/>'+
		'            </if>'+
		'            <else>'+
		'              <text variable="number" prefix="No. "/>'+
		'            </else>'+
		'          </choose>'+
		'        </group>'+
		'      </if>'+
		'      <else-if type="bill legislation" match="any">'+
		'        <group delimiter=", " prefix=", ">'+
		'          <choose>'+
		'            <if variable="number">'+
		'              <text variable="number" prefix="Pub. L. No. "/>'+
		'              <group delimiter=" ">'+
		'                <text term="section" form="symbol"/>'+
		'                <text variable="section"/>'+
		'              </group>'+
		'              <group delimiter=" ">'+
		'                <text variable="volume"/>'+
		'                <text variable="container-title"/>'+
		'                <text variable="page-first"/>'+
		'              </group>'+
		'            </if>'+
		'            <else>'+
		'              <group delimiter=" ">'+
		'                <text variable="volume"/>'+
		'                <text variable="container-title"/>'+
		'                <text term="section" form="symbol"/>'+
		'                <text variable="section"/>'+
		'              </group>'+
		'            </else>'+
		'          </choose>'+
		'        </group>'+
		'      </else-if>'+
		'    </choose>'+
		'  </macro>'+
		'  <citation et-al-min="6" et-al-use-first="1" et-al-subsequent-min="3" et-al-subsequent-use-first="1" disambiguate-add-year-suffix="true" disambiguate-add-names="true" disambiguate-add-givenname="true" collapse="year" givenname-disambiguation-rule="primary-name">'+
		'    <sort>'+
		'      <key macro="author" names-min="8" names-use-first="6"/>'+
		'      <key macro="issued-sort"/>'+
		'    </sort>'+
		'    <layout prefix="(" suffix=")" delimiter="; ">'+
		'      <group delimiter=", ">'+
		'        <text macro="author-short"/>'+
		'        <text macro="issued-year"/>'+
		'        <text macro="citation-locator"/>'+
		'      </group>'+
		'    </layout>'+
		'  </citation>'+
		'  <bibliography hanging-indent="true" et-al-min="8" et-al-use-first="6" et-al-use-last="true" entry-spacing="0" line-spacing="2">'+
		'    <sort>'+
		'      <key macro="author"/>'+
		'      <key macro="issued-sort" sort="ascending"/>'+
		'      <key macro="title"/>'+
		'    </sort>'+
		'    <layout>'+
		'      <group suffix=".">'+
		'        <group delimiter=". ">'+
		'          <text macro="author"/>'+
		'          <choose>'+
		'            <if is-uncertain-date="issued">'+
		'              <group prefix=" [" suffix="]" delimiter=" ">'+
		'                <text term="circa" form="short"/>'+
		'                <text macro="issued"/>'+
		'              </group>'+
		'            </if>'+
		'            <else>'+
		'              <text macro="issued" prefix=" (" suffix=")"/>'+
		'            </else>'+
		'          </choose>'+
		'          <text macro="title-plus-extra"/>'+
		'          <text macro="container"/>'+
		'        </group>'+
		'        <text macro="legal-cites"/>'+
		'        <text macro="locators"/>'+
		'        <group delimiter=", " prefix=". ">'+
		'          <text macro="event"/>'+
		'          <text macro="publisher"/>'+
		'        </group>'+
		'      </group>'+
		'      <text macro="access" prefix=" "/>'+
		'      <choose>'+
		'        <if is-uncertain-date="original-date">'+
		'          <group prefix=" [" suffix="]" delimiter=" ">'+
		'            <text macro="original-published"/>'+
		'            <text term="circa" form="short"/>'+
		'            <text macro="original-date"/>'+
		'          </group>'+
		'        </if>'+
		'        <else-if variable="original-date">'+
		'          <group prefix=" (" suffix=")" delimiter=" ">'+
		'            <text macro="original-published"/>'+
		'            <text macro="original-date"/>'+
		'          </group>'+
		'        </else-if>'+
		'      </choose>'+
		'    </layout>'+
		'  </bibliography>'+
		'</style>'

		let config = Cite.plugins.config.get('csl');
		config.templates.add(templateName, template);

		var subbib = function(bibobj, keyarr) {
			let filtered = _.filter(bibobj.data, function(item) {
				return keyarr.includes(item['citation-label']);
			});
			return Cite(filtered);
		};

		var not_in_bib = function(bibobj, keyarr) {
			// Return an array containing the elements of `keyarr` that are not
			// matched by entries in `bibobj`
			let labels = bibobj.data.map(d => d['citation-label']);
			let filtered = _.filter(keyarr, function(item) {
				return !labels.includes(item);
			});
			return filtered;
		};

		var inline_cites = {
			// We're going to look for inline citations in the format of [@citation_key]
			// where `citation_key` is generally (but not always) something like 
			// `author_year` (e.g., `jones_2014`). When we find one, we'll replace it 
			// with `<inlinecite>citation_key</inlinecite>`. Multiple inlines will go
			// from [@citekey_1, @citekey_2] to <inlinecite>citekey_1,citekey_2</inlinecite>.
			type: "lang",
			filter: function (text, converter, options) {
				var left = '\\[(@[^\\]]+)',
				right = '\\]',
				flags = 'g',
				replacement = function (wholeMatch, match, left, right) {

					// if there are multiple citations, split the match into an array
					var match = [];
					wholeMatch.split(",").forEach(function(item){
						let itrimmed = item.replace(/[\[@\]\s]/g, '');
						match.push(itrimmed);
					});

					return("<inlinecite>" + match + "</inlinecite>");
				};

				return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags);
			}
		};

		var read_bibli = {
			// This sub-extension will look for bibtex, wrapped in <bibtex></bibtex> tags.
			// When found, they'll be added to the cite object. 
			type: "lang",
			filter: function (text, converter, options) {
				var left = '<bibtex>',
				right = '</bibtex>',
				flags = 'g',
				replacement = function (wholeMatch, match, left, right) {
					let citeInfo = new Cite(wholeMatch.replace(/<\/*bibtex>/g, ''));
					// add citation data to "master list" of references
					// (automatically sorts and removes duplicates)
					allCites.add(citeInfo.data);
				};

				return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags);
			}
		};

		var print_bibli = {
			type: "output",
			filter: function(text){

				if(allCites.data.length > 0){

					// make bibliography
					var citeBib = allCites.format('bibliography', {
						format: 'html',
						template: templateName,
						lang: 'en-US',
						append: function (entry) {
							var doi = entry.DOI;
							if (typeof doi === 'undefined' || doi === null){
								return ""
							} else {
								return "  <a href = 'https://doi.org/" + doi + "' class='doiURL' target='_blank'>doi:" + doi + "</a>"
							}

						}
					})

					return ( text + "<h4 id='bibliography'>Bibliography</h4>" + citeBib );

				} else {

					return ( text );

				}

			}
		};
		
		var print_inline_cites = {
			type: "lang",
			filter: function(text) {
				var left = '<inlinecite>',
				right = '</inlinecite>',
				flags = 'g',
				replacement = function(wholeMatch, match, left, right) {
					let keys = wholeMatch.replace(/<\/*inlinecite>/g, '').split(",");
					let subcites = subbib(allCites, keys);

					let citestring =  subcites.format('citation', {
						format: 'html',
						template: templateName,
						lang: 'en-US'
					});

					if (subcites.data.length == 0) {
						// none of the keys handed in matched anything in the bib.
						// We'll just hand back the keys in parentheses
						citestring = "(" + keys.join(", ").replace(/_/g, "\\_") + ")";
					} else if (subcites.data.length < keys.length) {
						// At least one of the keys found a match, but not all keys
						// We'll insert the not found keys into the citation
						let nope = not_in_bib(allCites, keys).join("; ").replace(/_/g, "\\_");
						citestring = citestring.replace(/([^)]*)\)/g, "$1, " + nope + ")");						
					}
					return citestring;
				}
				return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags);
			},
		};

		return [read_bibli, inline_cites, print_inline_cites, print_bibli];

	});

});
