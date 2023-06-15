
## Textarea
```js
      const Textarea = defineComponent({
        props:{modelValue:String|Number,validation:Function},
        emits:['update:modelValue'],
        setup(props,{emit}){
          const message = ref('')
          const validation = props.validation || function(){return true}

          const validate=(val)=>{
            if(validation(val)){
              message.value = ''
              emit('update:modelValue',val)
            }else{
              message.value = '入力値が正しくありません'
            }
          }

          return {message,validate}
        },
        template:`
        <div>
          <div class=" text-lg font-bold"><slot></slot></div>
          <textarea :value="modelValue" @input="validate($event.target.value)"
          class="w-full"
          ></textarea>
          <p class="text-red-200"> {{ message }}</p>
        </div>
        `
      })
```

## TableFormatter
```js
      const TableFormatter = defineComponent({
        props:{columns:Array},
        emits:['change'],
        setup(props,{emit}){
          const message = ref('aaa')

          const validate=(val)=>{
            const values = val.split('\n').map(row=>row.split('\t'))
            const header = values.shift()
            if(!Array.isArray(header)){
              message.value='テーブルデータを貼り付けてください'
            }
            
            const columns = props.columns || header
            
            const items = values.map(row=>{
              return columns.reduce((item,colName,idx)=>{
                return Object.assign(item,{[colName]:row[idx]})
              },{})
            })

            emit('change',items)

          }

          return {message,validate}
        },
        template:`
        <div>
          <div class=" text-lg font-bold"><slot></slot></div>
          <textarea @change="validate($event.target.value)"
          class="w-full"
          ></textarea>
          <div class=" text-xs text-red-300"> {{ message }}</div>
        </div>
        `
      })
```
