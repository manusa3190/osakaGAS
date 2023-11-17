const doGet=()=>{
  const html = HtmlService.createTemplateFromFile('src/main')
  return html.evaluate()
}

function include(fileName=''){
  const content = HtmlService.createHtmlOutputFromFile(`src/${fileName}`).getContent()
  const res = content
    .replace(/<template>\n/,`<script type="text/x-template" id="${fileName}">`)
    .replace(/<\/template>\n\n<script>/,'</script>  <script>')
  return res
}
