const {
    quicktype,
    InputData,
    jsonInputForTargetLanguage,
    JSONSchemaInput,
    FetchingJSONSchemaStore,
  } = require("quicktype-core");

  
const file=require(`file-system`);
const prompt = require(`prompt-sync`)();
  async function quicktypeJSON(targetLanguage, typeName, jsonString) {
    const jsonInput = jsonInputForTargetLanguage(targetLanguage);
  
    await jsonInput.addSource({
      name: typeName,
      samples: [jsonString],
    });
  
    const inputData = new InputData();
    inputData.addInput(jsonInput);
  
    return await quicktype({
      inputData,
      lang: targetLanguage,
    });
  }
  
  async function quicktypeJSONSchema(targetLanguage, typeName, jsonSchemaString) {
    const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());
  
    // We could add multiple schemas for multiple types,
    // but here we`re just making one type from JSON schema.
    await schemaInput.addSource({ name: typeName, schema: jsonSchemaString });
  
    // const inputData = new InputData();
    // inputData.addInput(schemaInput);
  
    return await quicktype({
    //   inputData,
      lang: targetLanguage,
    });
  }

  async function generateModel(path,response,ApiName,request){
    // /home/asharora/Desktop/Enuke/ablecold_driver_app/lib/models
    var myPath=path+'lib/models/';
    if(response!=""){
      const { lines: responseModel } = await quicktypeJSON(
        "Dart",
        ApiName+"Response",
        JSON.stringify(JSON.parse(response)));
        var intialIndex=0;
        var isFirst=true;
        // console.log(responseModel.join("\n"));
        for(var i=0;i<responseModel.length;i++){
            if(responseModel[i].startsWith("class")){
              if(isFirst){
                isFirst=false;
              }else{
                var fileName=ApiName+(intialIndex==0?`Response.dart`:(responseModel[intialIndex].split(" ")[1]+'.dart'));
                var data=responseModel.slice(intialIndex,i).join("\n");
                file.writeFileSync(myPath+fileName, data, function(err) {});           
                intialIndex=i;
              }
            }
        }

        var fileName=ApiName+(intialIndex==0?`Response.dart`:(responseModel[intialIndex].split(" ")[1]+".dart"));
        var data=responseModel.slice(intialIndex,i).join("\n");
        file.writeFileSync(myPath+fileName, data, function(err) {});
   
       } 

    if(request!=""){
      const { lines: requestModel } = await quicktypeJSON(
        "Dart",
        ApiName+"Request",
        JSON.stringify(JSON.parse(request)));
        // console.log(requestModel.join("\n"));
          
        var intialIndex=0;
        var isFirst=true;
        // console.log(requestModel.join("\n"));
        for(var i=0;i<requestModel.length;i++){
            if(requestModel[i].startsWith("class")){
              if(isFirst){
                isFirst=false;
              }else{
                var fileName=ApiName+(intialIndex==0?`Request.dart`:(requestModel[intialIndex].split(" ")[1]+'.dart'));
                var data=requestModel.slice(intialIndex,i).join("\n");
                file.writeFileSync(myPath+fileName, data, function(err) {});           
                intialIndex=i;
              }
            }
        }

        var fileName=ApiName+(intialIndex==0?`Request.dart`:(requestModel[intialIndex].split(" ")[1]+".dart"));
        var data=requestModel.slice(intialIndex,i).join("\n");
        file.writeFileSync(myPath+fileName, data, function(err) {});
   } 
         
  }

  
  async function generateAction(path,response,ApiName,request,reduxName){
    var myPath=path+"lib/redux/actions/"+reduxName+"Actions.dart";
    
    const action=`class ${ApiName}Action {\n`+
    `      final ${ApiName+"Response"} payload;\n`+
    `      ${ApiName}Action(this.payload);\n`+
    `    }\n`+
    `    \n`+
    `    class Get${ApiName}Saga {\n`+
    `      ${request!=""?(ApiName+"Response"):`dynamic`} payload;\n`+
    `      dynamic context;\n`+
    `      dynamic onResultSuccess = () => {};\n`+
    `      ${ApiName}Saga(this.context);\n`+
    `      ${ApiName}Saga.payload(this.payload, this.context);\n`+
    `      ${ApiName}Saga.all(\n`+
    `          this.payload, this.context, this.onResultSuccess);\n`+
    `    }`;
    // console.log(action);
      file.appendFileSync(myPath, action, function(err) {})
         
  }

  async function generateReducer(path,response,ApiName,request,reduxName){
    var myPath=path+"lib/redux/reducers/"+reduxName+"Reducer.dart";
    const action=`class ${ApiName}Action {\n`+
    `      final ${ApiName+"Response"} payload;\n`+
    `      ${ApiName}Action(this.payload);\n`+
    `    }\n`+
    `    \n`+
    `    class ${ApiName}Saga {\n`+
    `      ${request!=""?(ApiName+"Response"):`dynamic`} payload;\n`+
    `      dynamic context;\n`+
    `      dynamic onResultSuccess = () => {};\n`+
    `      ${ApiName}Saga(this.context);\n`+
    `      ${ApiName}Saga.payload(this.payload, this.context);\n`+
    `      ${ApiName}Saga.all(\n`+
    `          this.payload, this.context, this.onResultSuccess);\n`+
    `    }`;

    const reducer=`${ApiName+`Response`} ${ApiName}Reducer(${ApiName+`Response`} state, dynamic action) {\n`+
    `  if (action is ${ApiName+`Action`}) {\n`+
    `    return action.payload;\n`+
    `  }\n`+
    `\n`+
    `  return state;\n`+
    `}\n`+
    ``;
      file.appendFileSync(myPath, action, function(err) {})
         
  }

  async function generateSaga(path,response,ApiName,request,reduxName){
    var myPath=path+"lib/redux/saga/"+reduxName+"Saga.dart";
    
    const saga=`get${ApiName}({Get${ApiName}Saga action}) sync* {\n`+
    `  yield Try(() sync* {\n`+
    `    var result = Result<Response>();\n`+
    `    yield Put(IsLoadingAction(true));\n`+
    `    yield Put(LoadingMessageAction("Please Wait..."));\n`+
    `    try {\n`+
    `      yield Call(APIProvider().get${ApiName},\n`+
    `          args: [request], result: result);\n`+
    `      var response = result.value;\n`+
    `      var responseBody = json.decode(response.body);\n`+
    `      yield Put(IsLoadingAction(false));\n`+
    `      if ((response.statusCode == 200 || response.statusCode == 400) &&\n`+
    `          responseBody["success"] == true) {\n`+
    `        ${ApiName}Response data =\n`+
    `            ${ApiName}Response.fromJson(responseBody);\n`+
    `        if (request.page == 1)\n`+
    `          yield Put(${ApiName}Action(data.data));\n`+
    `        else\n`+
    `          yield Put(${ApiName}Action(data.data));\n`+
    `      } else {}\n`+
    `    } catch (e) {\n`+
    `      print(e);\n`+
    `      yield Put(IsLoadingAction(false));\n`+
    `    }\n`+
    `  }, Catch: (e, s) sync* {\n`+
    `    yield Put(IsLoadingAction(false));\n`+
    `    print(e);\n`+
    `  });\n`+
    `}\n`+
    ``;
    
    file.appendFileSync(myPath, saga, function(err) {})
         
  }

  
  async function main() {
    const path = prompt(`path  =`);
    const response = prompt(`Response  =`);
    const ApiName  = prompt(`ApiName   =`);
    const request  = prompt(`Request   =`);
    const reduxFileName =prompt('Redux File Name =');
    
    await generateModel(path,response,ApiName,request);
    await generateAction(path,response,ApiName,request,reduxFileName);
    await generateReducer(path,response,ApiName,request,reduxFileName);
    await generateSaga(path,response,ApiName,request,reduxFileName);
       
  
  }
  
  main();

  // {"email":"admin@ablecold.com","password":"12345678"}